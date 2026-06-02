const db = require('../db/database');
const multer = require('multer');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Secure multer setup - use memory storage, add size limits and MIME validation
const upload = multer({
    storage: multer.memoryStorage(), // Don't write to disk
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (!allowedMimes.includes(file.mimetype)) {
            return cb(new Error('Only CSV and Excel files allowed'));
        }
        cb(null, true);
    }
});

// Helper: Parse CSV from buffer
function parseCSV(buffer) {
    return new Promise((resolve, reject) => {
        const results = [];
        const { Readable } = require('stream');
        Readable.from(buffer.toString())
            .pipe(csv(['guest_name', 'phone_number']))
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

// Helper: Parse Excel from buffer
function parseExcel(buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: ['guest_name', 'phone_number'], range: 1 });
    return data;
}

// Helper: Parse Google Sheet CSV export
async function parseGoogleSheet(sheetUrl) {
    // Expecting a public Google Sheet link, convert to CSV export
    const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) throw new Error('Invalid Google Sheet URL');
    const sheetId = match[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    const response = await axios.get(csvUrl);
    const results = [];
    require('stream').Readable.from(response.data)
        .pipe(csv(['guest_name', 'phone_number']))
        .on('data', (data) => results.push(data));
    // Wait for stream to finish
    return new Promise((resolve) => setTimeout(() => resolve(results), 1000));
}

// Main upload handler
exports.uploadGuests = async (req, res) => {
    try {
        const user_id = (req.user && req.user.userId) ? req.user.userId : (req.body.user_id || req.query.user_id);
        const eventId = req.body.event_id || req.query.event_id;
        if (!eventId) return res.status(400).json({ error: 'event_id is required' });

        let guests = [];
        if (req.file) {
            // File is now in memory (buffer), no need to delete from disk
            if (req.file.mimetype === 'text/csv') {
                guests = await parseCSV(req.file.buffer);
            } else {
                guests = parseExcel(req.file.buffer);
            }
        } else if (req.body.sheet_url) {
            guests = await parseGoogleSheet(req.body.sheet_url);
        } else {
            return res.status(400).json({ error: 'No file or Google Sheet URL provided' });
        }

        // Sanitize imported data
        const sanitized = guests
            .map(g => ({
                name: g.guest_name?.toString().trim().slice(0, 100) || ‘’,
                phone: g.phone_number?.toString().replace(/\D/g, ‘’).slice(0, 15) || ‘’
            }))
            .filter(g => g.name && g.phone);

        // Insert guests into DB
        const stmt = db.prepare(‘INSERT INTO guests (event_id, user_id, guest_name, phone_number, is_active) VALUES (?, ?, ?, ?, 1)’);
        let errors_array = [];
        sanitized.forEach(g => {
            // Validate phone has at least 10 digits
            if (g.phone.length >= 10) {
                stmt.run(eventId, user_id, g.name, g.phone);
            } else {
                errors_array.push({ guest_name: g.name, phone_number: g.phone });
                console.warn(`Invalid phone number for guest ${g.name}: ${g.phone}`);
            }
        });
        stmt.finalize();
        res.json({ message: 'Guests uploaded successfully', errors: errors_array });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to upload guests' });
    }
};

// Add individual guest
exports.addGuest = (req, res) => {
    try {
        const { event_id, guest_name, phone_number } = req.body;
        const user_id = (req.user && req.user.userId) ? req.user.userId : req.body.user_id;

        // Validation
        if (!event_id || !user_id || !guest_name || !phone_number) {
            return res.status(400).json({ error: 'Missing required fields: event_id, user_id, guest_name, phone_number' });
        }

        // Validate phone number format
        let phone = phone_number.toString().trim();
        if (phone.length < 10) {
            phone = '0' + phone;
        }

        // Check if guest already exists for this event
        db.get('SELECT id FROM guests WHERE event_id = ? AND phone_number = ? AND is_active = 1', [event_id, phone], (err, existingGuest) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (existingGuest) {
                return res.status(400).json({ error: 'Guest with this phone number already exists for this event' });
            }

            // Insert new guest
            const sql = 'INSERT INTO guests (event_id, user_id, guest_name, phone_number, is_active) VALUES (?, ?, ?, ?, 1)';
            db.run(sql, [event_id, user_id, guest_name.trim(), phone], function (err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to add guest' });
                }

                res.json({
                    message: 'Guest added successfully',
                    guestId: this.lastID,
                    guest: {
                        id: this.lastID,
                        event_id,
                        user_id,
                        guest_name: guest_name.trim(),
                        phone_number: phone
                    }
                });
            });
        });

    } catch (error) {
        console.error('Error adding guest:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Export multer upload middleware
exports.uploadMiddleware = upload.single('file');

// Soft delete a single guest by id (mark is_active = 0)
exports.softDeleteGuest = (req, res) => {
    try {
        const { id, event_id } = req.body;
        const user_id = (req.user && req.user.userId) ? req.user.userId : req.body.user_id;
        if (!id || !event_id || !user_id) {
            return res.status(400).json({ error: 'Missing required fields: id, event_id, user_id' });
        }

        const sql = 'UPDATE guests SET is_active = 0 WHERE id = ? AND event_id = ? AND user_id = ?';
        db.run(sql, [id, event_id, user_id], function (err) {
            if (err) {
                console.error('Database error (softDeleteGuest):', err);
                return res.status(500).json({ error: 'Failed to delete guest' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Guest not found or already deleted' });
            }
            return res.json({ message: 'Guest deleted successfully', id });
        });
    } catch (error) {
        console.error('Error soft deleting guest:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Soft delete multiple guests by ids (mark is_active = 0)
exports.softDeleteGuestsBulk = (req, res) => {
    try {
        const { ids, event_id } = req.body;
        const user_id = (req.user && req.user.userId) ? req.user.userId : req.body.user_id;
        if (!Array.isArray(ids) || ids.length === 0 || !event_id || !user_id) {
            return res.status(400).json({ error: 'Missing required fields: ids[], event_id, user_id' });
        }

        const placeholders = ids.map(() => '?').join(',');
        const sql = `UPDATE guests SET is_active = 0 WHERE id IN (${placeholders}) AND event_id = ? AND user_id = ?`;
        const params = [...ids, event_id, user_id];
        db.run(sql, params, function (err) {
            if (err) {
                console.error('Database error (softDeleteGuestsBulk):', err);
                return res.status(500).json({ error: 'Failed to delete guests' });
            }
            return res.json({ message: 'Guests deleted successfully', deletedCount: this.changes });
        });
    } catch (error) {
        console.error('Error soft deleting guests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}; 
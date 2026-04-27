const db = require('../db/database');
const multer = require('multer');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Helper: Parse CSV file
function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv(['guest_name', 'phone_number']))
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

// Helper: Parse Excel file
function parseExcel(filePath) {
    const workbook = xlsx.readFile(filePath);
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
            const ext = path.extname(req.file.originalname).toLowerCase();
            if (ext === '.csv') {
                guests = await parseCSV(req.file.path);
            } else if (ext === '.xlsx' || ext === '.xls') {
                guests = parseExcel(req.file.path);
            } else {
                return res.status(400).json({ error: 'Unsupported file type' });
            }
            fs.unlinkSync(req.file.path); // Clean up
        } else if (req.body.sheet_url) {
            guests = await parseGoogleSheet(req.body.sheet_url);
        } else {
            return res.status(400).json({ error: 'No file or Google Sheet URL provided' });
        }

        // Insert guests into DB
        const stmt = db.prepare('INSERT INTO guests (event_id, user_id, guest_name, phone_number, is_active) VALUES (?, ?, ?, ?, 1)');
        let errors_array = [];
        guests.forEach(g => {
            if (g.guest_name && g.phone_number) {
                // Ensure it's a string
                let phone = g.phone_number.toString().trim();

                // Check that it’s only digits
                if (/^\d+$/.test(phone)) {
                    // If less than 10 digits, pad with leading zero
                    if (phone.length < 10) {
                        phone = phone.padStart(10, '0');
                    }

                    stmt.run(eventId, user_id, g.guest_name, phone);
                } else {
                    errors_array.push({ guest_name: g.guest_name, phone_number: g.phone_number });
                    console.warn(`Invalid phone number for guest ${g.guest_name}: ${g.phone_number}`);
                }
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
// RSVP Controller - Handles business logic for RSVP endpoints
const db = require('../db/database');

exports.getAllRsvps = (req, res) => {
    const eventId = req.query.eventId;

    let sql = `SELECT * FROM rsvp_responses`;
    let params = [];

    if (eventId) {
        sql += ` WHERE event_id = ?`;
        params.push(eventId);
    }

    sql += ` ORDER BY submitted_at DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch RSVPs' });
        }
        res.json(rows);
    });
};

exports.getRsvpById = (req, res) => {
    // TODO: Implement fetching a single RSVP by ID
    res.json({ message: 'getRsvpById not implemented' });
};

exports.createRsvp = (req, res) => {
    const { eventId, name, phone, status, guests } = req.body;

    // Validation
    if (!eventId || !name || !phone || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate status
    if (status !== 'coming' && status !== 'not_coming') {
        return res.status(400).json({ error: 'Invalid status value' });
    }

    // Convert guests to number, default to 1 if coming, 0 if not coming
    const numberOfGuests = status === 'coming' ? (parseInt(guests) || 1) : 1;

    const sql = `INSERT INTO rsvp_responses (event_id, guest_name, phone_number, status, number_of_guests) VALUES (?, ?, ?, ?, ?)`;

    db.run(sql, [eventId, name, phone, status, numberOfGuests], function (err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to save RSVP' });
        }
        // send a message to the guest whatsapp
        // send a message to the guest whatsapp
        const requestLang = (req.headers['x-lang'] || req.body.lang || '').toString().toLowerCase();
        const lang = ['ar', 'he', 'en'].includes(requestLang) ? requestLang : 'ar';

        const messages = {
            ar: {
                coming: `*مرحباً ${name}*،\n\nشكراً جزيلاً على تأكيد حضورك لمناسبتنا!\nنحن في غاية السعادة لكونك جزءاً من هذه اللحظة الخاصة بالنسبة لنا.\nنتطلع لرؤيتكم ❤️\nعدد الضيوف: ${numberOfGuests}\n\nمع خالص التحية،\n*Vivento*`,
                not_coming: `*مرحباً ${name}*،\n\nشكراً جزيلاً على التحديث. نحن نتفهم ونقدّر أنك أخذت من وقتك لإعلامنا.\nسوف نشعر بوجودك في قلوبنا حتى لو لم تتمكن/ي من التواجد معنا جسدياً، ونأمل أن نلتقي في مناسبات سعيدة أخرى قريباً!\n\nمع كامل التقدير والمحبة،\n*Vivento*`
            },
            he: {
                coming: `*היי ${name}*\n\nתודה רבה שאישרת הגעה לאירוע שלנו!\nאנחנו נרגשים ושמחים שאת/ה חלק מהרגע המיוחד הזה.\nמחכים לראותך ❤️\nמספר אורחים: ${numberOfGuests}\n\nבאהבה,\n*Vivento*`,
                not_coming: `*היי ${name}*\n\nתודה שלקחת זמן לעדכן.\nאנחנו מבינים ומעריכים את זה מאוד.\nנשמח לראותך בשמחות נוספות בקרוב!\n\nתודה וחיבוק,\n*Vivento*`
            },
            en: {
                coming: `*Hi ${name}*\n\nThank you so much for confirming your attendance!\nWe’re thrilled to have you with us on this special occasion.\nLooking forward to seeing you ❤️\nGuests: ${numberOfGuests}\n\nWith love,\n*Vivento*`,
                not_coming: `*Hi ${name}*\n\nThank you for the update.\nWe totally understand and appreciate you letting us know.\nWe hope to celebrate together on another happy occasion soon!\n\nWarm regards,\n*Vivento*`
            }
        };

        const message_content = status === 'coming' ? messages[lang].coming : messages[lang].not_coming;

        const insertSql = `
                    INSERT INTO messaging_queue 
                        (phone_number, guest_name, source, event_id, message, status) 
                    SELECT ?, ?, 'rsvp', id, ?, 'pending'
                    FROM events
                    WHERE id = ?;
                `;

        db.run(insertSql, [phone, name, message_content, eventId], function (err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to save RSVP' });
            }
        });

        res.status(201).json({
            success: true,
            message: 'RSVP submitted successfully',
            id: this.lastID
        });
    });
};

exports.updateRsvp = (req, res) => {
    // TODO: Implement updating an RSVP
    res.json({ message: 'updateRsvp not implemented' });
};

exports.deleteRsvp = (req, res) => {
    // TODO: Implement deleting an RSVP
    res.json({ message: 'deleteRsvp not implemented' });
};

exports.getEventById = (req, res) => {
    const eventId = req.params.id;
    const sql = `SELECT * FROM events WHERE id = ?`;
    db.get(sql, [eventId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Event not found' });
        }
        // Format the event as expected by the frontend
        const event = {
            id: row.id,
            name: row.name,
            date: row.date,
            location: {
                address: row.location_address,
                coordinates: {
                    lat: row.latitude,
                    lng: row.longitude
                }
            },
            googleMapsUrl: row.google_maps_url,
            wazeUrl: row.waze_url
        };
        res.json(event);
    });
};

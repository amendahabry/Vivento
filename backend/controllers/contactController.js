require('dotenv').config();
const db = require('../db/database');
const nodemailer = require("nodemailer");
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

function createSmtpTransporter() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!user || !pass) {
        return null;
    }
    return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
    });
}

function queueAdminWhatsAppMessage(messageText) {
    const phone = process.env.ADMIN_NOTIFY_PHONE;
    const guestName = process.env.ADMIN_NOTIFY_NAME || 'Admin';
    if (!phone) return;
    db.run(
        `INSERT INTO messaging_queue (phone_number, guest_name, source, message, status) 
                        VALUES (?, ?, ?, ?, ?)`,
        [phone, guestName, 'admin', messageText, 'pending'],
        function (err) {
            if (err) console.error(err.message);
        }
    );
}

exports.submitContact = (req, res) => {
    const { name, phone, email, termsAccepted, privacyAccepted } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ error: 'Name and phone are required' });
    }

    // Validate email format if provided
    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
    }

    // Validate phone format
    if (phone.length < 10) {
        return res.status(400).json({ error: 'Phone must be at least 10 digits' });
    }

    const username = phone;
    const password = crypto.randomBytes(16).toString('base64').slice(0, 16); // Stronger password

    // Use transaction to ensure atomicity
    db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Transaction failed to start' });
        }

        // Step 1: Insert contact
        const sql = `INSERT INTO contacts (name, phone, email, accept_terms, accept_policy) VALUES (?, ?, ?, ?, ?)`;
        db.run(sql, [name, phone, email, termsAccepted, privacyAccepted], function (err) {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Failed to save contact.' });
            }
            const contactId = this.lastID;

            // Step 2: Hash password and insert user
            bcrypt.hash(password, 10, (err, hash) => {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Failed to create user.' });
                }

                db.run('INSERT INTO users (username, password_hash, contact_id) VALUES (?, ?, ?)', [username, hash, contactId], function (err) {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: 'Failed to create user.' });
                    }
                    const userId = this.lastID;

                    // Step 3: Insert event
                    const eventId = uuidv4();
                    db.run('INSERT INTO events (id, user_id) VALUES (?, ?)', [eventId, userId], function (err) {
                        if (err) {
                            console.error(err.message);
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: 'Failed to create event.' });
                        }

                    // ---- Language & BiDi helpers ----
                    const requestLang = (req.headers['x-lang'] || req.body.lang || '').toString().toLowerCase();
                    const lang = ['ar', 'he', 'en'].includes(requestLang) ? requestLang : 'ar';
                    const ltr = (text) => `\u202A${text}\u202C`;      // force LTR for mixed content
                    const ltrInline = (t) => `${t}\u200E`;            // small LTR mark (optional)

                    // ---- 1) Welcome + details (NO PASSWORD) ----
                    const mainMessages = {
                        ar: `مرحباً! 😊 أهلاً بك في *Vivento*!
  لقد استلمنا طلبك ونحن بالفعل نعمل عليه 💬
  سنتواصل معك قريباً جداً – سيكون الأمر مميزاً! 🎉
  
  * إليك التفاصيل التي زودتنا بها:
  الاسم: ${name}
  الهاتف: ${phone}
  البريد الإلكتروني: ${ltrInline(email || '')}
  * *طريقة الدخول*
  اسم المستخدم: ${ltr(username)}
  كلمة المرور سوف تصلك برساله اخرى
  رابط الدخول: https://viventoevents.com/signin`,

                        he: `היי! 😊 ברוך/ה הבא/ה ל-*Vivento*!
  קיבלנו את פנייתך ואנחנו כבר מטפלים בה 💬
  ניצור קשר ממש בקרוב – זה יהיה מיוחד! 🎉
  
  * הפרטים שמסרת:
  שם: ${name}
  טלפון: ${phone}
  אימייל: ${ltrInline(email || '')}
  * *פרטי התחברות*
  שם משתמש: ${ltr(username)}
  הסיסמה תגיע עוד רגע
  לינק כניסה: https://viventoevents.com/signin`,

                        en: `Hi! 😊 Welcome to *Vivento*!
  We received your request and we’re already on it 💬
  We’ll get back to you very soon – it’s going to be special! 🎉
  
  * Here are the details you provided:
  Name: ${name}
  Phone: ${phone}
  Email: ${email || ''}
  * *Login Details*
  Username: ${username}
  You will get the password in a moment
  Link to signin: https://viventoevents.com/signin`
                    };

                    // ---- 2) Password as a separate message ONLY ----
                    const passwordMessages = {
                        ar: `${ltr(password)}`,
                        he: `${ltr(password)}`,
                        en: `${password}`
                    };

                    // Queue WhatsApp messages (two rows)
                    const insertMsgSQL = `INSERT INTO messaging_queue
              (phone_number, guest_name, source, source_id, event_id, message, status)
              VALUES (?, ?, ?, ?, ?, ?, ?)`;

                    db.run(insertMsgSQL, [phone, name, 'contact', contactId, eventId, mainMessages[lang], 'pending'], function (err) {
                        if (err) {
                            console.error(err.message);
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: 'Failed to queue main WhatsApp message.' });
                        }

                        db.run(insertMsgSQL, [phone, name, 'contact', contactId, eventId, passwordMessages[lang], 'pending'], function (err) {
                            if (err) {
                                console.error(err.message);
                                db.run('ROLLBACK');
                                return res.status(500).json({ error: 'Failed to queue password WhatsApp message.' });
                            }

                            // Commit transaction
                            db.run('COMMIT', (err) => {
                                if (err) {
                                    console.error('Commit failed:', err);
                                    db.run('ROLLBACK');
                                    return res.status(500).json({ error: 'Failed to commit transaction.' });
                                }

                                // Respond (password not returned for security)
                                res.json({
                                    message: 'Contact, user, event, and WhatsApp messages created.',
                                    username,
                                    eventId
                                });

                                // Send emails asynchronously (outside transaction)
                                if (email) {
                                    sendEmailNotificationToUser(name, phone, email);
                                }
                                sendEmailNotificationToAdmin(name, phone, username);
                            });
                        });
                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};

exports.getAllContacts = (req, res) => {
    const sql = `SELECT * FROM contacts ORDER BY created_at DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch contacts' });
        }
        res.json(rows);
    });
};

function sendEmailNotificationToUser(name, phone, email) {
    const transporter = createSmtpTransporter();
    if (!transporter) {
        console.warn('SMTP_USER / SMTP_PASS not set; skipping user email.');
        return;
    }

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: `Vivento - Thank you for contacting us`,
        text: `Thank you for contacting us ${name}!
      
        Your message has been received and we will get back to you as soon as possible.
        This is your details:
        Name: ${name}
        Phone: ${phone}
        Email: ${email}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
        } else {
            console.log("Email sent:", info.response);
        }
    });
}

function sendEmailNotificationToAdmin(name, phone, username, password) {
    const transporter = createSmtpTransporter();
    const adminTo = process.env.ADMIN_NOTIFY_EMAIL;
    if (!transporter || !adminTo) {
        console.warn('SMTP or ADMIN_NOTIFY_EMAIL not set; skipping admin email.');
        return;
    }

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: adminTo,
        subject: `Vivento - New Contact from ${name}`,
        text: `You have a new contact:
      
  Name: ${name}
  Phone: ${phone}
  Username: ${username}
  Password: ${password}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
        } else {
            console.log("Email sent:", info.response);
        }
    });

    queueAdminWhatsAppMessage(mailOptions.text);
}
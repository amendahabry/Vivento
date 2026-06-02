const db = require('../db/database');

exports.getEvent = (req, res) => {
  const userId = req.user.userId;
  db.get(`
    SELECT e.*, ii.s3_url as invitation_image_url, ii.original_filename as invitation_image_name
    FROM events e
    LEFT JOIN invitation_images ii ON e.invitation_image_id = ii.id
    WHERE e.user_id = ? 
    ORDER BY e.created_at DESC 
    LIMIT 1
  `, [userId], (err, event) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (!event) return res.status(404).json({ message: 'No event found for user.' });
    res.json(event);
  });
};

exports.getGuests = (req, res) => {
  const userId = req.user.userId;
  db.get('SELECT id FROM events WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [userId], (err, event) => {
    if (err || !event) return res.json([]);
    db.all(`
            SELECT a.id, a.event_id, a.user_id, a.guest_name, a.phone_number, a.created_at
            FROM guests a
            WHERE a.event_id = ? AND ifnull(a.is_active, 1) = 1
            GROUP BY a.id, a.event_id, a.user_id, a.guest_name, a.phone_number, a.created_at
            ORDER BY a.created_at DESC`, [event.id], (err, guests) => {
      if (err) return res.status(500).json({ message: 'Database error.' });
      res.json(guests);
    });
  });
};

exports.getResponses = (req, res) => {
  const userId = req.user.userId;
  db.get('SELECT id FROM events WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [userId], (err, event) => {
    if (err || !event) return res.json([]);
    db.all('SELECT distinct * FROM rsvp_responses WHERE event_id = ? ORDER BY submitted_at DESC', [event.id], (err, responses) => {
      if (err) return res.status(500).json({ message: 'Database error.' });
      res.json(responses);
    });
  });
};

exports.getStats = (req, res) => {
  const userId = req.user.userId;
  db.get('SELECT id FROM events WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [userId], (err, event) => {
    if (err || !event) return res.json({ totalGuests: 0, coming: 0, notComing: 0, rsvpRate: 0 });
    let totalGuests;
    db.all(`SELECT SUM(number_of_guests) AS counting
                FROM rsvp_responses
                WHERE event_id = ?
 `, [event.id], (err, counting) => {
      if (err) return res.status(500).json({ message: 'Database error.' });
      db.all(
        `SELECT status, SUM(number_of_guests) AS guest_count
         FROM rsvp_responses
         WHERE event_id = ?
         GROUP BY status`,
        [event.id],
        (err, rows) => {
          if (err) return res.status(500).json({ message: 'Database error.' });

          let coming = notComing = totalGuests = 0;

          // Iterate over the results to aggregate based on status
          rows.forEach(row => {
            if (row.status === 'coming') {
              coming = row.guest_count;
            } else if (row.status === 'not_coming') {
              notComing = row.guest_count;
            }
            totalGuests++;
          });

          // Calculate the RSVP rate (percentage of guests coming)
          const rsvpRate = totalGuests > 0 ? (coming / totalGuests) * 100 : 0;

          res.json({
            totalGuests,
            coming,
            notComing,
            rsvpRate: rsvpRate.toFixed(2) + '%'
          });
        }
      );
    });
  });
};

exports.addGuestsToMessagingQueue = (req, res) => {
  const userId = req.user.userId;

  // Small helpers
  const normalizeLang = (val, fallback = 'ar') => {
    const raw = (val || '').toString().trim().toLowerCase();
    const base = raw.split(/[_-]/)[0];
    if (['ar', 'he', 'en'].includes(base)) return base;
    if (base === 'iw') return 'he';
    return fallback;
  };

  const runAsync = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve(this); // so you can read lastID, changes, etc.
      });
    });

  // 1) Get user's most recent event
  db.get(
    'SELECT id, name, date, location_address, time FROM events WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
    [userId],
    (err, event) => {
      if (err || !event) {
        return res.status(404).json({ message: 'No event found for user.' });
      }

      // 2) Guests not yet messaged
      const sql = `
        SELECT a.id, a.event_id, a.user_id, a.guest_name, a.phone_number, a.created_at, a.approved_messages
        FROM guests a
        WHERE a.event_id = ? 
          AND IFNULL(a.is_active, 1) = 1 
        GROUP BY a.id, a.event_id, a.user_id, a.guest_name, a.phone_number, a.created_at
      `;

      db.all(sql, [event.id], async (err, guests) => {
        if (err) return res.status(500).json({ message: 'Database error.' });
        if (!guests?.length) {
          return res.json({ message: 'No guests to add to messaging queue.', addedCount: 0 });
        }

        // 3) Language once
        const requestLang = req.headers['x-lang'] || req.body?.lang || '';
        const lang = normalizeLang(requestLang, 'ar'); // change default if you want

        // 4) Templates
        const introTemplates = {
          ar: (g) => `مرحباً ${g.guest_name}! 😊

نود دعوتك إلى المناسبه: *${event.name}*.
إذا كنت موافق بقبول تفاصيل إضافية ورابط لتأكيد الحضور، يُرجى الرد على هذه الرسالة بكلمة "*نعم*".`,
          he: (g) => `שלום ${g.guest_name}! 😊

נשמח להזמין אותך לאירוע: *${event.name}*.
אם את/ה מסכים/ה לקבל פרטים נוספים ולינק לאישור הגעה, אנא השב/י למסרון זה במילה "*כן*".`,
          en: (g) => `Hello ${g.guest_name}! 😊

We’d love to invite you to the event: *${event.name}*.
If you agree to recieve further details and a url to approve arrival, please reply to this message with the word "*yes*".`,
        };

        const rsvpTemplates = {
          ar: (g) => `مرحباً ${g.guest_name}! 😊

يسعدنا أن ندعوك إلى: *${event.name}*!
في تاريخ: *${event.date}*, *${event.time}*
المكان: *${event.location_address}*
اضغط هنا لتأكيد حضورك:
https://viventoevents.com/event/${event.id} ✅

سعداء برؤيتك – ستكون لحظة مميزة جداً! 💖`,
          he: (g) => `שלום ${g.guest_name}! 😊

נשמח להזמין אותך ל: *${event.name}*!
בתאריך: *${event.date}*, *${event.time}*
מיקום: *${event.location_address}*
לחץ/י כאן לאישור הגעה:
https://viventoevents.com/event/${event.id} ✅

מחכים לראותך – הולך להיות מרגש! 💖`,
          en: (g) => `Hello ${g.guest_name}! 😊

We're excited to invite you to: ${event.name}!
On Date: *${event.date}*, *${event.time}*
Place: *${event.location_address}*
Tap here to RSVP:
https://viventoevents.com/event/${event.id} ✅

We can't wait to see you – it's going to be special! 💖`,
        };

        const introFor = introTemplates[lang] || introTemplates.ar;
        const rsvpFor = rsvpTemplates[lang] || rsvpTemplates.ar;

        // If you keep a lang column, add it here and to INSERT
        const insertIntroSQL = `
          INSERT INTO messaging_queue (phone_number, guest_name, source, source_id, event_id, message, status)
          VALUES (?, ?, 'guest', ?, ?, ?, 'pending')
        `;
        const insertRsvpSQL = `
          INSERT INTO messaging_queue (phone_number, guest_name, source, source_id, event_id, message, status)
          VALUES (?, ?, 'guest', ?, ?, ?, 'pending_response')
        `;

        let addedIntro = 0, addedRsvp = 0, errors = 0;

        try {
          // Insert both messages per guest (keep order)
          for (const g of guests) {
            try {
              if (g.approved_messages != '1') {
                const introMsg = introFor(g);
                await runAsync(insertIntroSQL, [g.phone_number, g.guest_name, g.user_id, g.event_id, introMsg]);
                // pending response for new guests
                const rsvpMsg = rsvpFor(g);
                await runAsync(insertRsvpSQL, [g.phone_number, g.guest_name, g.user_id, g.event_id, rsvpMsg]);
                addedIntro++;
              } else {
                const rsvpMsg = rsvpFor(g);
                await runAsync(insertIntroSQL, [g.phone_number, g.guest_name, g.user_id, g.event_id, rsvpMsg]);
                addedRsvp++;
              }
            } catch (e) {
              console.error('Queue insert error for guest', g.id, e);
              errors++;
            }
          }

          return res.json({
            message: `Queued ${addedIntro} intro and ${addedRsvp} RSVP messages. ${errors} guests failed.`,
            lang,
            counts: { intro: addedIntro, rsvp: addedRsvp, errors }
          });

        } catch (outerErr) {
          console.error('Batch queue error:', outerErr);
          return res.status(500).json({ message: 'Failed to enqueue messages.' });
        }
      });
    }
  );
};

// New function to add only selected guests to messaging queue
exports.addSelectedGuestsToMessagingQueue = (req, res) => {
  const userId = req.user.userId;
  const { selectedGuestIds } = req.body;

  // Validate input
  if (!selectedGuestIds || !Array.isArray(selectedGuestIds) || selectedGuestIds.length === 0) {
    return res.status(400).json({ message: 'No guest IDs provided.' });
  }

  // Validate all IDs are positive integers
  if (!selectedGuestIds.every(id => Number.isInteger(Number(id)) && Number(id) > 0)) {
    return res.status(400).json({ message: 'Invalid guest IDs format. All IDs must be positive integers.' });
  }

  // Small helpers
  const normalizeLang = (val, fallback = 'ar') => {
    const raw = (val || '').toString().trim().toLowerCase();
    const base = raw.split(/[_-]/)[0];
    if (['ar', 'he', 'en'].includes(base)) return base;
    if (base === 'iw') return 'he';
    return fallback;
  };

  const runAsync = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve(this); // so you can read lastID, changes, etc.
      });
    });

  // 1) Get user's most recent event
  db.get(
    'SELECT id, name, date, location_address, time FROM events WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
    [userId],
    (err, event) => {
      if (err || !event) {
        return res.status(404).json({ message: 'No event found for user.' });
      }

      // 2) Get only the selected guests
      const placeholders = selectedGuestIds.map(() => '?').join(',');
      const sql = `
        SELECT a.id, a.event_id, a.user_id, a.guest_name, a.phone_number, a.created_at, a.approved_messages
        FROM guests a
        WHERE a.event_id = ? 
          AND a.id IN (${placeholders})
          AND IFNULL(a.is_active, 1) = 1 
        GROUP BY a.id, a.event_id, a.user_id, a.guest_name, a.phone_number, a.created_at
      `;

      const params = [event.id, ...selectedGuestIds];
      db.all(sql, params, async (err, guests) => {
        if (err) return res.status(500).json({ message: 'Database error.' });
        if (!guests?.length) {
          return res.json({ message: 'No selected guests found.', addedCount: 0 });
        }

        // 3) Language once
        const requestLang = req.headers['x-lang'] || req.body?.lang || '';
        const lang = normalizeLang(requestLang, 'ar'); // change default if you want

        // 4) Templates
        const introTemplates = {
          ar: (g) => `مرحباً ${g.guest_name}! 😊

نود دعوتك إلى المناسبه: *${event.name}*.
إذا كنت بقبول تفاصيل إضافية ورابط لتأكيد الحضور، يُرجى الرد على هذه الرسالة بكلمة "*نعم*".`,
          he: (g) => `שלום ${g.guest_name}! 😊

נשמח להזמין אותך לאירוע: *${event.name}*.
אם את/ה מסכים/ה לקבל פרטים נוספים ולינק לאישור הגעה, אנא השב/י למסרון זה במילה "*כן*".`,
          en: (g) => `Hello ${g.guest_name}! 😊

We'd love to invite you to the event: *${event.name}*.
If you agree to recieve further details and a url to approve arrival, please reply to this message with the word "*yes*".`,
        };

        const rsvpTemplates = {
          ar: (g) => `مرحباً ${g.guest_name}! 😊

يسعدنا أن ندعوك إلى: *${event.name}*!
في تاريخ: *${event.date}*, *${event.time}*
المكان: *${event.location_address}*
اضغط هنا لتأكيد حضورك:
https://viventoevents.com/event/${event.id} ✅

سعداء برؤيتك – ستكون لحظة مميزة جداً! 💖`,
          he: (g) => `שלום ${g.guest_name}! 😊

נשמח להזמין אותך ל: *${event.name}*!
בתאריך: *${event.date}*, *${event.time}*
מיקום: *${event.location_address}*
לחץ/י כאן לאישור הגעה:
https://viventoevents.com/event/${event.id} ✅

מחכים לראותך – הולך להיות מרגש! 💖`,
          en: (g) => `Hello ${g.guest_name}! 😊

We're excited to invite you to: ${event.name}!
On Date: *${event.date}*, *${event.time}*
Place: *${event.location_address}*
Tap here to RSVP:
https://viventoevents.com/event/${event.id} ✅

We can't wait to see you – it's going to be special! 💖`,
        };

        const introFor = introTemplates[lang] || introTemplates.ar;
        const rsvpFor = rsvpTemplates[lang] || rsvpTemplates.ar;

        // If you keep a lang column, add it here and to INSERT
        const insertIntroSQL = `
          INSERT INTO messaging_queue (phone_number, guest_name, source, source_id, event_id, message, status)
          VALUES (?, ?, 'guest', ?, ?, ?, 'pending')
        `;
        const insertRsvpSQL = `
          INSERT INTO messaging_queue (phone_number, guest_name, source, source_id, event_id, message, status)
          VALUES (?, ?, 'guest', ?, ?, ?, 'pending_response')
        `;

        let addedIntro = 0, addedRsvp = 0, errors = 0;

        try {
          // Insert both messages per selected guest (keep order)
          for (const g of guests) {
            try {
              if (g.approved_messages != '1') {
                const introMsg = introFor(g);
                await runAsync(insertIntroSQL, [g.phone_number, g.guest_name, g.user_id, g.event_id, introMsg]);
                addedIntro++;
                const rsvpMsg = rsvpFor(g);
                await runAsync(insertRsvpSQL, [g.phone_number, g.guest_name, g.user_id, g.event_id, rsvpMsg]);
                addedRsvp++;
              } else {
                const rsvpMsg = rsvpFor(g);
                await runAsync(insertIntroSQL, [g.phone_number, g.guest_name, g.user_id, g.event_id, rsvpMsg]);
                addedRsvp++;
              }
            } catch (e) {
              console.error('Queue insert error for guest', g.id, e);
              errors++;
            }
          }

          return res.json({
            message: `Queued ${addedIntro} intro and ${addedRsvp} RSVP messages for ${guests.length} selected guests. ${errors} guests failed.`,
            lang,
            counts: { intro: addedIntro, rsvp: addedRsvp, errors, totalSelected: guests.length }
          });

        } catch (outerErr) {
          console.error('Batch queue error:', outerErr);
          return res.status(500).json({ message: 'Failed to enqueue messages.' });
        }
      });
    }
  );
};

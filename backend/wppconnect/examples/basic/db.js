const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../../Vivento.sqlite3');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Could not connect to database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

function insertImageToDB(phone_number, event_id) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT id, phone_number, guest_name, source, source_id
      , event_id, status, message, created_at, sent_at
      FROM messaging_queue
      WHERE status IN ('sent', 'pending') AND phone_number = ? AND event_id = ?;
    `;
    db.all(sql, [phone_number, event_id], (err, rows) => {
      if (err) {
        console.error('Database error:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function getEventUploadPhotosLinksToSend() {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO messaging_queue (phone_number, guest_name, source, source_id, event_id, status, message)
      SELECT DISTINCT b.phone_number,b.guest_name,'upload-photo' [source],a.user_id,a.id [event_id]
      ,'pending' [status],'לצילום ושיתוף תמונות בתוך האירוע, כנסו ללינק: ' || CHAR(10) || 'https://viventoevents.com/upload-photos/' || a.id AS message
      FROM events a LEFT JOIN rsvp_responses b ON a.id = b.event_id
      WHERE a.date = date('now','localtime')
      AND time('now','localtime') >= time(a.time,'-1 hours')
      AND b.phone_number NOT IN (SELECT phone_number FROM messaging_queue WHERE event_id = a.id AND source = 'upload-photo');
      `;
    db.all(sql, (err, rows) => {
      if (err) {
        console.error('Database error:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function getWhatsappMessagesToSend() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT distinct a.event_id,a.phone_number,a.id,a.message,b.approved_messages 
      FROM messaging_queue a
      LEFT JOIN guests b ON a.phone_number = b.phone_number AND b.is_active = 1
      WHERE a.status = 'pending' AND a.phone_number LIKE '05%' AND LENGTH(a.phone_number) = 10 AND a.sent_at IS NULL
      LIMIT 1
    `;
    db.all(sql, (err, rows) => {
      if (err) {
        console.error('Database error:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function updateSentTime(id) {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE messaging_queue
      SET sent_at = datetime('now', 'localtime'), status = 'sent'
      WHERE id = ?
    `;
    db.run(sql, [id], function (err) {
      if (err) {
        console.error('Database error:', err.message);
        reject(err);
      } else {
        resolve({ changes: this.changes }); // returns how many rows were updated
      }
    });
  });
}

function getEventDetails(phoneNumber, eventid) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT e.id, e.name, e.date, e.location_address, ii.s3_url as invitation_image_url, ii.id as [inv_id]
      FROM events e
      LEFT JOIN invitation_images ii ON e.invitation_image_id = ii.id
      LEFT JOIN guests g ON e.id = g.event_id AND g.phone_number = ?
      WHERE e.id = ?
    `;
    db.get(sql, [phoneNumber, eventid], (err, event) => {
      if (err) {
        reject(err);
      } else {
        resolve(event);
      }
    });
  });
}

function markGuestAsResponded(phoneNumber) {
  return new Promise((resolve, reject) => {
    const updateQueueSQL = `
      UPDATE messaging_queue
      SET status = 'pending'
      WHERE phone_number = ?
        AND source = 'guest'
        AND status = 'pending_response'
    `;
    db.get(updateQueueSQL, [phoneNumber], (err, guest) => {
      if (err) {
        reject(err);
      } else {
        resolve(guest);
      }
    });

    const updateGuestSQL = `
      UPDATE guests
      SET approved_messages = 1
      WHERE phone_number = ?
    `;
    db.get(updateGuestSQL, [phoneNumber], (err, guest) => {
      if (err) {
        reject(err);
      } else {
        resolve(guest);
      }
    });
  });
}


function getGuestInfo(phoneNumber, eventId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT guest_name, event_id
      FROM guests
      WHERE phone_number = ? AND event_id = ? AND ifnull(is_active, 1) = 1
    `;
    db.get(sql, [phoneNumber, eventId], (err, guest) => {
      if (err) {
        reject(err);
      } else {
        resolve(guest);
      }
    });
  });
}

module.exports = {
  insertImageToDB,
  updateSentTime,
  getWhatsappMessagesToSend,
  getEventDetails,
  markGuestAsResponded,
  getGuestInfo,
  getEventUploadPhotosLinksToSend
};

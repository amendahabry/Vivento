const db = require('./database');
const fs = require('fs');
const path = require('path');

// Read and execute the migration
const migrationPath = path.join(__dirname, 'migrations', 'add_photos_table.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

db.exec(migrationSQL, (err) => {
  if (err) {
    console.error('Error executing migration:', err);
  } else {
    console.log('Database migration completed successfully');
  }
});

// Read and execute the S3 update migration
const s3MigrationPath = path.join(__dirname, 'migrations', 'update_photos_for_s3.sql');
const s3MigrationSQL = fs.readFileSync(s3MigrationPath, 'utf8');

db.exec(s3MigrationSQL, (err) => {
  if (err) {
    console.error('Error executing S3 migration:', err);
  } else {
    console.log('S3 database migration completed successfully');
  }
});

// Initialize other tables if they don't exist
const initSQL = `
-- Events table
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    location_address TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    google_maps_url TEXT,
    waze_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- RSVP responses table
CREATE TABLE IF NOT EXISTS rsvp_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL,
    guest_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('coming', 'not_coming')),
    number_of_guests INTEGER DEFAULT 1,
    submitted_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    contact_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    guest_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Visits table for tracking user visits
CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    language TEXT,
    screen_resolution TEXT,
    timezone TEXT,
    referrer TEXT,
    page_url TEXT,
    session_id TEXT,
    visit_duration INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_rsvp_event_id ON rsvp_responses(event_id);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);
CREATE INDEX IF NOT EXISTS idx_visits_device_id ON visits(device_id);
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON visits(created_at);
CREATE INDEX IF NOT EXISTS idx_visits_ip_address ON visits(ip_address);

-- Insert sample event if not exists
INSERT OR IGNORE INTO events (id, name, date, location_address, latitude, longitude, google_maps_url, waze_url) VALUES
('abc123-def456-ghi789', 'Sarah & Michael Event', '2025-10-28', '123 Event Venue, Beautiful Gardens, City Center', 32.0853, 34.7818, 
 'https://www.google.com/maps?q=32.0853,34.7818', 
 'https://waze.com/ul?ll=32.0853,34.7818&navigate=yes');
`;

db.exec(initSQL, (err) => {
  if (err) {
    console.error('Error initializing database:', err);
  } else {
    console.log('Database initialization completed');
  }
});

// Ensure guests table has is_active column for soft delete
// try {
//   db.all("PRAGMA table_info(guests)", (err, rows) => {
//     if (err) {
//       console.error('Error checking guests table schema:', err);
//       return;
//     }
//     const hasIsActive = Array.isArray(rows) && rows.some((col) => col.name === 'is_active');
//     if (!hasIsActive) {
//       db.run("ALTER TABLE guests ADD COLUMN is_active INTEGER DEFAULT 1", (alterErr) => {
//         if (alterErr) {
//           console.error('Error adding is_active column to guests table:', alterErr);
//         } else {
//           console.log('Added is_active column to guests table');
//         }
//       });
//     }
//   });
// } catch (e) {
//   console.error('Unexpected error ensuring is_active column:', e);
// }

module.exports = db; 
-- Migration to create/update photos table for Google Drive integration

-- Drop existing table if it exists
DROP TABLE IF EXISTS event_photos;

-- Create new photos table with Google Drive integration
CREATE TABLE photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wedding_id TEXT NOT NULL,                    -- Wedding/Event ID
    guest_name TEXT NOT NULL,                    -- Name of the guest who uploaded
    device_id TEXT,                              -- Device identifier
    file_id TEXT NOT NULL,                       -- Google Drive file ID
    web_view_link TEXT NOT NULL,                 -- Google Drive web view link
    web_content_link TEXT NOT NULL,              -- Google Drive direct download link
    uploaded_at TEXT DEFAULT (datetime('now'))   -- Upload timestamp
);

-- Create indexes for better performance
CREATE INDEX idx_photos_wedding_id ON photos(wedding_id);
CREATE INDEX idx_photos_uploaded_at ON photos(uploaded_at);
CREATE INDEX idx_photos_guest_name ON photos(guest_name); 
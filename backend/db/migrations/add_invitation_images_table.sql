-- Add invitation_images table
CREATE TABLE IF NOT EXISTS invitation_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    original_filename TEXT NOT NULL,
    s3_key TEXT NOT NULL,
    s3_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invitation_images_event_id ON invitation_images(event_id);
CREATE INDEX IF NOT EXISTS idx_invitation_images_user_id ON invitation_images(user_id);

-- Add invitation_image_id column to events table if it doesn't exist
ALTER TABLE events ADD COLUMN invitation_image_id INTEGER REFERENCES invitation_images(id); 
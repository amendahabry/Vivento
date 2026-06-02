-- Create messaging_queue table for WhatsApp notifications
-- This table is referenced throughout the codebase but was never created

CREATE TABLE IF NOT EXISTS messaging_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT NOT NULL,
    guest_name TEXT NOT NULL,
    source TEXT NOT NULL,
    source_id INTEGER,
    event_id TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'pending_response', 'sent', 'failed')),
    created_at TEXT DEFAULT (datetime('now')),
    sent_at TEXT,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messaging_queue_status ON messaging_queue(status);
CREATE INDEX IF NOT EXISTS idx_messaging_queue_phone ON messaging_queue(phone_number);
CREATE INDEX IF NOT EXISTS idx_messaging_queue_event_id ON messaging_queue(event_id);

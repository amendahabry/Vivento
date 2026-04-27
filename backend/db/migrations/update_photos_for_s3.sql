-- Migration to update photos table for S3 integration

-- Add status column if it doesn't exist
ALTER TABLE photos ADD COLUMN status INTEGER DEFAULT 1;

-- Update existing photos to use S3 keys instead of Google Drive URLs
-- This will be handled by the application logic when photos are accessed

-- Create index on status for better performance
CREATE INDEX IF NOT EXISTS idx_photos_status ON photos(status);

-- Update the table structure to better reflect S3 usage
-- Note: file_id now stores the S3 key with structure: events/{eventId}/album/{timestamp}_{random}.{ext}
-- web_view_link and web_content_link are kept for backward compatibility but now store S3 keys
-- The new folder structure organizes photos by:
-- - events/{eventId}/album/ - for event photos
-- - events/{eventId}/invitation_image/ - for invitation images 
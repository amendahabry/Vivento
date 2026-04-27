-- Migration to add enhanced page tracking columns to visits table

-- Add new columns for page tracking
ALTER TABLE visits ADD COLUMN page_name TEXT;
ALTER TABLE visits ADD COLUMN page_path TEXT;
ALTER TABLE visits ADD COLUMN previous_page TEXT;
ALTER TABLE visits ADD COLUMN navigation_type TEXT;

-- Create indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_visits_page_name ON visits(page_name);
CREATE INDEX IF NOT EXISTS idx_visits_page_path ON visits(page_path);
CREATE INDEX IF NOT EXISTS idx_visits_navigation_type ON visits(navigation_type);

-- Update existing records to have default values for new columns
UPDATE visits SET 
    page_name = 'Legacy Visit',
    page_path = '/',
    previous_page = NULL,
    navigation_type = 'reload'
WHERE page_name IS NULL; 
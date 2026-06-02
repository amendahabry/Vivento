-- Add missing columns to events table
-- These columns are queried throughout the codebase but don't exist in the schema

ALTER TABLE events ADD COLUMN time TEXT;
ALTER TABLE events ADD COLUMN note TEXT;

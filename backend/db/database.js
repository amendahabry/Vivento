const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../Vivento.sqlite3');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('FATAL: Could not connect to database', err);
    process.exit(1);
  }

  // Enable foreign key constraints (required for CASCADE deletes)
  db.run('PRAGMA foreign_keys = ON', (err) => {
    if (err) {
      console.error('Could not enable foreign keys', err);
    } else {
      console.log('Foreign key constraints enabled');
    }
  });

  // Validate database is accessible
  db.get('SELECT 1', (checkErr) => {
    if (checkErr) {
      console.error('FATAL: Database validation failed', checkErr);
      process.exit(1);
    }
    console.log('Connected to SQLite database at', dbPath);
  });
});

module.exports = db;

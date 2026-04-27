const db = require('./database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Running migration: add_invitation_images_table.sql');
    
    const migrationPath = path.join(__dirname, 'migrations', 'add_invitation_images_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        await new Promise((resolve, reject) => {
          db.run(statement, (err) => {
            if (err) {
              console.error('Error executing statement:', err);
              reject(err);
            } else {
              resolve();
            }
          });
        });
      }
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 
// Configuration example for the photo upload system
// Copy this file to config.js and update with your values

module.exports = {
  // Local File Storage Configuration
  fileStorage: {
    // Base URL for serving uploaded files
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    // Upload directory for photos
    uploadDir: './uploads/photos',
    // Maximum file size in bytes (10MB)
    maxFileSize: 10 * 1024 * 1024
  },
  
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development'
  },
  
  // Database Configuration
  database: {
    path: './Vivento.sqlite3'
  },
  
  // File Upload Configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  },

  // AWS S3 Configuration (prefer environment variables; see .env.example)
  S3_BUCKET: process.env.S3_BUCKET || 'your-bucket-name',
  S3_REGION: process.env.S3_REGION || 'eu-central-1',
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID || '',
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || ''
}; 
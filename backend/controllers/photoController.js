const multer = require('multer');
const path = require('path');
const { promisify } = require('util');
require('dotenv').config();
const { S3Service } = require('../services/s3Service');
const AWS = require('aws-sdk');

// Initialize S3 service
const s3Service = new S3Service();

// Configure multer for memory storage (buffer)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

class PhotoController {
  // Upload photo endpoint
  static async uploadPhoto(req, res) {
    try {
      upload.single('photo')(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ success: false, message: err.message });
        }
        if (!req.file) {
          return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const { eventId, guestName, deviceId } = req.body;
        if (!eventId || !guestName) {
          return res.status(400).json({ success: false, message: 'Missing required fields: eventId, guestName' });
        }
        
        // Upload to S3 using the new service method
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileName = `event-photo-${uniqueSuffix}-${req.file.originalname}`;
        
        let s3Result;
        try {
          s3Result = await s3Service.uploadPhoto(req.file.buffer, fileName, req.file.mimetype, eventId);
        } catch (s3err) {
          console.error('S3 upload error:', s3err);
          return res.status(500).json({ success: false, message: 'Error uploading to S3' });
        }
        
        // Store in database with S3 key instead of direct URLs
        const db = require('../db/database');
        const query = `
          INSERT INTO photos (event_id, guest_name, device_id, file_id, web_view_link, web_content_link, uploaded_at, status)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now','localtime'), 1)
        `;
        
        db.run(query, [
          eventId,
          guestName,
          deviceId || 'unknown',
          s3Result.s3Key, // Store S3 key instead of direct URL
          s3Result.s3Key, // Store S3 key in web_view_link for now
          s3Result.s3Key  // Store S3 key in web_content_link for now
        ], function (err) {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Error saving photo metadata' });
          }
          
          res.json({
            success: true,
            message: 'Photo uploaded successfully',
            data: {
              photoId: this.lastID,
              s3Key: s3Result.s3Key
            }
          });
        });
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Get photos for an event
  static async getEventPhotos(req, res) {
    try {
      const { eventId } = req.params;

      if (!eventId) {
        return res.status(400).json({
          success: false,
          message: 'event ID is required'
        });
      }

      const db = require('../db/database');
      const query = `
        SELECT id, guest_name, device_id, file_id, uploaded_at
        FROM photos 
        WHERE status = 1 and event_id = ? 
        ORDER BY uploaded_at DESC
      `;

      db.all(query, [eventId], async (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Error fetching photos'
          });
        }

        // Generate presigned URLs for each photo
        try {
          const photosWithUrls = await Promise.all(
            rows.map(async (photo) => {
              try {
                const presignedUrl = await s3Service.getPhotoPresignedUrl(photo.file_id);
                return {
                  ...photo,
                  presignedUrl,
                  expiresIn: 300 // 5 minutes
                };
              } catch (urlError) {
                console.error('Error generating presigned URL for photo:', photo.id, urlError);
                return {
                  ...photo,
                  presignedUrl: null,
                  error: 'Failed to generate access URL'
                };
              }
            })
          );

          res.json({
            success: true,
            data: photosWithUrls
          });
        } catch (urlError) {
          console.error('Error generating presigned URLs:', urlError);
          res.status(500).json({
            success: false,
            message: 'Error generating photo access URLs'
          });
        }
      });
    } catch (error) {
      console.error('Get photos error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get photos for an event by device ID (user's photos only)
  static async getUserEventPhotos(req, res) {
    try {
      const { eventId, deviceId } = req.params;

      if (!eventId || !deviceId) {
        return res.status(400).json({
          success: false,
          message: 'event ID and device ID are required'
        });
      }

      const db = require('../db/database');
      const query = `
        SELECT id, guest_name, device_id, file_id, uploaded_at
        FROM photos 
        WHERE status = 1 and event_id = ? AND device_id = ?
        ORDER BY uploaded_at DESC
      `;

      db.all(query, [eventId, deviceId], async (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Error fetching photos'
          });
        }

        // Generate presigned URLs for each photo
        try {
          const photosWithUrls = await Promise.all(
            rows.map(async (photo) => {
              try {
                const presignedUrl = await s3Service.getPhotoPresignedUrl(photo.file_id);
                return {
                  ...photo,
                  presignedUrl,
                  expiresIn: 300 // 5 minutes
                };
              } catch (urlError) {
                console.error('Error generating presigned URL for photo:', photo.id, urlError);
                return {
                  ...photo,
                  presignedUrl: null,
                  error: 'Failed to generate access URL'
                };
              }
            })
          );

          res.json({
            success: true,
            data: photosWithUrls
          });
        } catch (urlError) {
          console.error('Error generating presigned URLs:', urlError);
          res.status(500).json({
            success: false,
            message: 'Error generating photo access URLs'
          });
        }
      });
    } catch (error) {
      console.error('Get user photos error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Generate a pre-signed S3 URL for a photo
  static async getPresignedUrl(req, res) {
    try {
      const { photoId } = req.params;
      const db = require('../db/database');
      
      db.get('SELECT file_id FROM photos WHERE id = ?', [photoId], async (err, row) => {
        if (err || !row) {
          return res.status(404).json({ error: 'Photo not found' });
        }
        
        try {
          const presignedUrl = await s3Service.getPhotoPresignedUrl(row.file_id);
          res.json({ 
            url: presignedUrl,
            expiresIn: 300,
            s3Key: row.file_id
          });
        } catch (urlError) {
          console.error('Error generating presigned URL:', urlError);
          res.status(500).json({ error: 'Could not generate pre-signed URL' });
        }
      });
    } catch (error) {
      console.error('Get presigned URL error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // Generate a pre-signed S3 URL for an invitation photo
  static async getPresignedUrlForInvitationPhoto(req, res) {
    try {
      const { photoId } = req.params;
      const db = require('../db/database');
      
      db.get('SELECT s3_url as [file_id] FROM invitation_images WHERE id = ?', [photoId], async (err, row) => {
        if (err || !row) {
          return res.status(404).json({ error: 'Invitation image not found' });
        }
        
        try {
          const presignedUrl = await s3Service.getPhotoPresignedUrl(row.file_id); // 30 seconds for invitations
          res.json({ 
            url: presignedUrl,
            expiresIn: 300,
            s3Key: row.file_id
          });
        } catch (urlError) {
          console.error('Error generating invitation presigned URL:', urlError);
          res.status(500).json({ error: 'Could not generate pre-signed URL' });
        }
      });
    } catch (error) {
      console.error('Get invitation presigned URL error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete photo
  static async deletePhoto(req, res) {
    try {
      const { photoId } = req.params;
      if (!photoId) {
        return res.status(400).json({ success: false, message: 'Photo ID is required' });
      }
      
      const db = require('../db/database');
      // First get the file info
      db.get('SELECT file_id FROM photos WHERE id = ?', [photoId], async (err, row) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ success: false, message: 'Error fetching photo' });
        }
        if (!row) {
          return res.status(404).json({ success: false, message: 'Photo not found' });
        }
        
        // Delete from S3 using the new service method
        try {
          if (row.file_id) {
            await s3Service.deletePhoto(row.file_id);
          }
        } catch (s3err) {
          console.error('S3 delete error:', s3err);
          // Continue with database deletion even if S3 deletion fails
        }
        
        // Delete from database
        db.run('UPDATE photos SET status = 0 WHERE id = ?', [photoId], function (err) {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Error deleting photo' });
          }
          res.json({ success: true, message: 'Photo deleted successfully' });
        });
      });
    } catch (error) {
      console.error('Delete photo error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Get event album statistics
  static async getEventAlbumStats(req, res) {
    try {
      const { eventId } = req.params;
      
      if (!eventId) {
        return res.status(400).json({ success: false, message: 'Event ID is required' });
      }

      // Get S3 album statistics
      const albumStats = await s3Service.getEventAlbumStats(eventId);
      
      // Get database photo count
      const db = require('../db/database');
      const query = 'SELECT COUNT(*) as count FROM photos WHERE event_id = ? AND status = 1';
      
      db.get(query, [eventId], (err, row) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ success: false, message: 'Error fetching photo count' });
        }

        const dbPhotoCount = row ? row.count : 0;
        
        res.json({
          success: true,
          data: {
            ...albumStats,
            databasePhotoCount: dbPhotoCount,
            s3PhotoCount: albumStats.totalPhotos,
            syncStatus: dbPhotoCount === albumStats.totalPhotos ? 'synced' : 'out_of_sync'
          }
        });
      });
    } catch (error) {
      console.error('Get album stats error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}

module.exports = PhotoController; 
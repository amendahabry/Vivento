require('dotenv').config();
const AWS = require('aws-sdk');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION || 'eu-central-1'
});

const s3 = new AWS.S3();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

class S3Service {
  constructor() {
    this.bucketName = process.env.S3_BUCKET || 'vivento-event-photos';
  }

  // Generate unique S3 key for the image
  generateS3Key(eventName, originalFilename) {
    const sanitizedEventName = eventName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalFilename);
    
    return `events/${sanitizedEventName}/invitation_image/${timestamp}_${randomString}${extension}`;
  }

  // Generate S3 key for photos organized by event ID and album
  generatePhotoS3Key(eventId, originalFilename) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalFilename);
    
    return `events/${eventId}/album/${timestamp}_${randomString}${extension}`;
  }

  // Generate S3 key for invitation image organized by event ID
  generateInvitationImageS3Key(eventId, originalFilename) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalFilename);

    return `events/${eventId}/invitation_image/${timestamp}_${randomString}${extension}`;
  }

  // Upload image to S3
  async uploadImage(fileBuffer, eventName, originalFilename, mimeType) {
    try {
      const s3Key = this.generateS3Key(eventName, originalFilename);
      
      const uploadParams = {
        Bucket: this.bucketName,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimeType,
        // ACL: 'public-read',
        Metadata: {
          'original-filename': originalFilename,
          'event-name': eventName,
          'uploaded-at': new Date().toISOString()
        }
      };

      const result = await s3.upload(uploadParams).promise();
      
      return {
        s3Key: s3Key,
        s3Url: result.Location,
        fileSize: fileBuffer.length,
        mimeType: mimeType
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload image to S3');
    }
  }

  // Upload invitation image to S3 under events/{eventId}/invitation_image/
  async uploadInvitationImage(fileBuffer, eventId, originalFilename, mimeType) {
    try {
      const s3Key = this.generateInvitationImageS3Key(eventId, originalFilename);

      const uploadParams = {
        Bucket: this.bucketName,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimeType,
        Metadata: {
          'original-filename': originalFilename,
          'uploaded-at': new Date().toISOString(),
          'type': 'invitation_image',
          'event-id': eventId,
          'folder': 'invitation_image'
        }
      };

      const result = await s3.upload(uploadParams).promise();

      return {
        s3Key,
        s3Url: result.Location,
        fileSize: fileBuffer.length,
        mimeType
      };
    } catch (error) {
      console.error('S3 invitation image upload error:', error);
      throw new Error('Failed to upload invitation image to S3');
    }
  }

  // Delete image from S3
  async deleteImage(s3Key) {
    try {
      const deleteParams = {
        Bucket: this.bucketName,
        Key: s3Key
      };

      await s3.deleteObject(deleteParams).promise();
      return true;
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error('Failed to delete image from S3');
    }
  }

  // Get presigned URL for temporary access
  async getPresignedUrl(s3Key, expiresIn = 3600) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: s3Key,
        Expires: expiresIn
      };

      return await s3.getSignedUrlPromise('getObject', params);
    } catch (error) {
      console.error('S3 presigned URL error:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  // Get presigned URL for photos (shorter expiration for security)
  async getPhotoPresignedUrl(s3Key, expiresIn = 300) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: s3Key,
        Expires: expiresIn
      };

      return await s3.getSignedUrlPromise('getObject', params);
    } catch (error) {
      console.error('S3 photo presigned URL error:', error);
      throw new Error('Failed to generate photo presigned URL');
    }
  }

  // Upload photo to S3 (specific for photos)
  async uploadPhoto(fileBuffer, fileName, mimeType, eventId) {
    try {
      // Generate S3 key with event ID and album folder structure
      const s3Key = this.generatePhotoS3Key(eventId, fileName);
      
      const uploadParams = {
        Bucket: this.bucketName,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimeType,
        Metadata: {
          'original-filename': fileName,
          'uploaded-at': new Date().toISOString(),
          'type': 'photo',
          'event-id': eventId,
          'folder': 'album'
        }
      };

      const result = await s3.upload(uploadParams).promise();
      
      return {
        s3Key: s3Key,
        s3Url: result.Location,
        fileSize: fileBuffer.length,
        mimeType: mimeType
      };
    } catch (error) {
      console.error('S3 photo upload error:', error);
      throw new Error('Failed to upload photo to S3');
    }
  }

  // Delete photo from S3
  async deletePhoto(s3Key) {
    try {
      const deleteParams = {
        Bucket: this.bucketName,
        Key: s3Key
      };

      await s3.deleteObject(deleteParams).promise();
      return true;
    } catch (error) {
      console.error('S3 photo delete error:', error);
      throw new Error('Failed to delete photo from S3');
    }
  }

  // List photos in an event album
  async listEventPhotos(eventId, maxKeys = 1000) {
    try {
      const prefix = `events/${eventId}/album/`;
      
      const listParams = {
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys
      };

      const result = await s3.listObjectsV2(listParams).promise();
      
      return result.Contents?.map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
        etag: item.ETag
      })) || [];
    } catch (error) {
      console.error('S3 list photos error:', error);
      throw new Error('Failed to list photos from S3');
    }
  }

  // Get event album statistics
  async getEventAlbumStats(eventId) {
    try {
      const photos = await this.listEventPhotos(eventId);
      
      const totalSize = photos.reduce((sum, photo) => sum + photo.size, 0);
      const totalPhotos = photos.length;
      
      return {
        eventId,
        totalPhotos,
        totalSize,
        averageSize: totalPhotos > 0 ? totalSize / totalPhotos : 0
      };
    } catch (error) {
      console.error('S3 album stats error:', error);
      throw new Error('Failed to get album statistics');
    }
  }
}

module.exports = { S3Service, upload }; 
const db = require('../db/database');
const { S3Service, upload } = require('../services/s3Service');

const s3Service = new S3Service();

// Upload invitation image
exports.uploadInvitationImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { eventId } = req.params;
    const userId = req.user.userId;

    // Get event details
    const event = await new Promise((resolve, reject) => {
      db.get('SELECT id, name FROM events WHERE id = ? AND user_id = ?', [eventId, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found or access denied' });
    }

    // Upload to S3 using the explicit invitation image method and eventId path
    const uploadResult = await s3Service.uploadInvitationImage(
      req.file.buffer,
      event.id,
      req.file.originalname,
      req.file.mimetype
    );

    // Save to database
    const insertSql = `
      INSERT INTO invitation_images (event_id, user_id, original_filename, s3_key, s3_url, file_size, mime_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const imageId = await new Promise((resolve, reject) => {
      db.run(insertSql, [
        eventId,
        userId,
        req.file.originalname,
        uploadResult.s3Key,
        uploadResult.s3Key, // Store S3 key instead of direct URL
        uploadResult.fileSize,
        uploadResult.mimeType
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    // Update event with invitation image reference
    await new Promise((resolve, reject) => {
      db.run('UPDATE events SET invitation_image_id = ? WHERE id = ?', [imageId, eventId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({
      message: 'Invitation image uploaded successfully',
      imageId,
      s3Key: uploadResult.s3Key,
      fileSize: uploadResult.fileSize
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload invitation image' });
  }
};

// Get invitation image for an event
exports.getInvitationImage = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;

    const sql = `
      SELECT ii.* FROM invitation_images ii
      JOIN events e ON ii.event_id = e.id
      WHERE e.id = ? AND e.user_id = ?
    `;

    db.get(sql, [eventId, userId], async (err, image) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!image) {
        return res.status(404).json({ error: 'No invitation image found' });
      }

      // Generate presigned URL for the image
      try {
        const presignedUrl = await s3Service.getPhotoPresignedUrl(image.s3_key, 300); // 5 minutes
        res.json({
          ...image,
          presignedUrl,
          expiresIn: 300
        });
      } catch (urlError) {
        console.error('Error generating presigned URL:', urlError);
        res.status(500).json({ error: 'Failed to generate image access URL' });
      }
    });
  } catch (error) {
    console.error('Get invitation image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete invitation image
exports.deleteInvitationImage = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;

    // Get image details
    const image = await new Promise((resolve, reject) => {
      const sql = `
        SELECT ii.* FROM invitation_images ii
        JOIN events e ON ii.event_id = e.id
        WHERE e.id = ? AND e.user_id = ?
      `;
      db.get(sql, [eventId, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!image) {
      return res.status(404).json({ error: 'No invitation image found' });
    }

    // Delete from S3 using the new service method
    await s3Service.deleteImage(image.s3_key);

    // Delete from database
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM invitation_images WHERE id = ?', [image.id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Remove reference from event
    await new Promise((resolve, reject) => {
      db.run('UPDATE events SET invitation_image_id = NULL WHERE id = ?', [eventId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ message: 'Invitation image deleted successfully' });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete invitation image' });
  }
};

// Middleware for handling file upload
exports.uploadMiddleware = upload.single('invitationImage'); 
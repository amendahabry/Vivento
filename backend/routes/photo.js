const express = require('express');
const router = express.Router();
const PhotoController = require('../controllers/photoController');

// Upload photo
router.post('/upload', PhotoController.uploadPhoto);

// Get all photos for an event
router.get('/event/:eventId', PhotoController.getEventPhotos);

// Get user's photos for an event (by device ID)
router.get('/user/:eventId/:deviceId', PhotoController.getUserEventPhotos);

// Get pre-signed S3 URL for a photo
router.get('/:photoId/presigned', PhotoController.getPresignedUrl);

// Get pre-signed S3 URL for an invitation photo
router.get('/:photoId/presignedForInvitations', PhotoController.getPresignedUrlForInvitationPhoto);

// Get event album statistics
router.get('/event/:eventId/stats', PhotoController.getEventAlbumStats);

// Delete a photo
router.delete('/:photoId', PhotoController.deletePhoto);

module.exports = router; 
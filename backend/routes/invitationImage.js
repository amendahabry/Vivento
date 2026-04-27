const express = require('express');
const router = express.Router();
const invitationImageController = require('../controllers/invitationImageController');
const { authenticateToken } = require('../middleware/security');

// Apply authentication middleware to all routes
// router.use(authenticateToken);

// Upload invitation image
router.post('/upload/:eventId', 
  invitationImageController.uploadMiddleware,
  invitationImageController.uploadInvitationImage
);

// Get invitation image for an event
router.get('/:eventId', invitationImageController.getInvitationImage);

// Delete invitation image
router.delete('/:eventId', invitationImageController.deleteInvitationImage);

module.exports = router; 
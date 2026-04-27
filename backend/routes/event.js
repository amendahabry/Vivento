const express = require('express');
const router = express.Router();
const EventController = require('../controllers/eventController');
const guestController = require('../controllers/guestController');
const authMiddleware = require('../middleware/security');

// Validate event by ID
router.get('/validate/:eventId', EventController.validateEvent);

// Get event details by ID
router.get('/:eventId', EventController.getEvent);

// Get all events
router.get('/', EventController.getAllEvents);

// Update event details by ID
router.put('/update/:eventId', authMiddleware, EventController.updateEvent);

// Upload guests (CSV, Excel, or Google Sheet link)
router.post('/guests/upload', authMiddleware, guestController.uploadMiddleware, guestController.uploadGuests);

// Add individual guest
router.post('/guests/add', authMiddleware, guestController.addGuest);

// Soft delete a single guest
router.post('/guests/delete', authMiddleware, guestController.softDeleteGuest);

// Soft delete multiple guests
router.post('/guests/delete-bulk', authMiddleware, guestController.softDeleteGuestsBulk);

module.exports = router; 
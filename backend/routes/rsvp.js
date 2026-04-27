const express = require('express');
const router = express.Router();
const rsvpController = require('../controllers/rsvpController');

// GET all RSVPs
router.get('/', rsvpController.getAllRsvps);

// GET RSVP by ID
router.get('/:id', rsvpController.getRsvpById);

// GET event details by ID
router.get('/events/:id', rsvpController.getEventById);

// POST create RSVP
router.post('/submit_response', rsvpController.createRsvp);

// PUT update RSVP
router.put('/:id', rsvpController.updateRsvp);

// DELETE RSVP
router.delete('/:id', rsvpController.deleteRsvp);

module.exports = router;

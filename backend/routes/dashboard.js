const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/security');

router.get('/event', authMiddleware, dashboardController.getEvent);
router.get('/guests', authMiddleware, dashboardController.getGuests);
router.get('/stats', authMiddleware, dashboardController.getStats);
router.get('/responses', authMiddleware, dashboardController.getResponses);
router.post('/add-guests-to-queue', authMiddleware, dashboardController.addGuestsToMessagingQueue);
router.post('/add-selected-guests-to-queue', authMiddleware, dashboardController.addSelectedGuestsToMessagingQueue);

module.exports = router; 
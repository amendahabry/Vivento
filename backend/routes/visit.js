const express = require('express');
const router = express.Router();
const visitController = require('../controllers/visitController');

// Track a new visit
router.post('/track', visitController.trackVisit);

// Track a page visit with enhanced data
router.post('/track-page', visitController.trackPageVisit);

// Update visit duration
router.put('/duration', visitController.updateVisitDuration);

// Get visit statistics
router.get('/stats', visitController.getVisitStats);

// Get recent visits
router.get('/recent', visitController.getRecentVisits);

module.exports = router; 
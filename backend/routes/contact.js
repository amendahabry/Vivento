const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// POST submit contact form
router.post('/submit', contactController.submitContact);

// GET all contacts (for admin purposes)
router.get('/', contactController.getAllContacts);

module.exports = router; 
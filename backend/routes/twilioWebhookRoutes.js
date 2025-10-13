const express = require('express');
const router = express.Router();
const { handleStatusCallback } = require('../controllers/twilioWebhookController');

// Twilio status callback endpoint (no auth - Twilio posts here)
router.post('/status', handleStatusCallback);

module.exports = router;

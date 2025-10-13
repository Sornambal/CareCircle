const express = require('express');
const router = express.Router();
const { triggerVoiceSOS } = require('../controllers/sosTriggerController');
const { protect } = require('../middleware/auth');

// Protected endpoint: caller must be authenticated. We will use the authenticated
// user's registered phone (e.g., elderlyPhone) when caregiverPhone is not provided.
router.post('/trigger', protect, triggerVoiceSOS);

module.exports = router;

const express = require('express');
const router = express.Router();
const { triggerSOS } = require('../controllers/sosController');
const { protect } = require('../middleware/auth');

router.route('/').post(protect, triggerSOS);

module.exports = router;

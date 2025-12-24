const express = require('express');
const router = express.Router();
const { medicineChatHandler } = require('../controllers/medicineChatController');

// POST /api/chat/medicine
router.post('/medicine', medicineChatHandler);

module.exports = router;

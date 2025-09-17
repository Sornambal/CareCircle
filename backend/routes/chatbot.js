const express = require('express');
const router = express.Router();
const {
  chatWithBot,
  getHistory,
} = require('../controllers/chatbotController');
const { protect } = require('../middleware/auth');

router.route('/chat').post(protect, chatWithBot);
router.route('/history').get(protect, getHistory);

module.exports = router;

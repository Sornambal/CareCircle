const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  getDashboard,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.route('/dashboard').get(protect, getDashboard);

module.exports = router;

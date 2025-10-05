const express = require('express');
const router = express.Router();

const { registerUser, login, authUser, sendOTP, verifyOTP, elderlyLogin } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

module.exports = router;

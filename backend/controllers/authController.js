const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { encrypt, decrypt } = require('../middleware/encryption');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const registerUser = async (req, res) => {
  const {
    elderlyName,
    elderlyAge,
    elderlyPhone,
    elderlyEmail,
    caregiverName,
    caregiverPhone,
    caregiverEmail,
    preferredLanguage,
    password,
  } = req.body;

  try {
    // Check if elderly user or caregiver already exists
    const elderlyExists = await User.findOne({ elderlyPhone });
    const caregiverExists = await User.findOne({ caregiverPhone });

    if (elderlyExists || caregiverExists) {
      return res.status(400).json({ message: 'User or caregiver already exists' });
    }

    // Create new user document with elderly and caregiver details
    const user = await User.create({
      elderlyName,
      elderlyAge,
      elderlyPhone,
      elderlyEmail,
      caregiverName,
      caregiverPhone,
      caregiverEmail,
      preferredLanguage,
      password,
    });

    res.status(201).json({
      _id: user._id,
      elderlyName: user.elderlyName,
      caregiverName: user.caregiverName,
      preferredLanguage: user.preferredLanguage,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  let { caregiverName, caregiverPhone, name, phone, password, role, deviceToken } = req.body;

  // Map generic name and phone to caregiverName and caregiverPhone if present
  caregiverName = caregiverName || name;
  caregiverPhone = caregiverPhone || phone;

  try {
    let user;
    if (role === 'elderly' && deviceToken) {
      // Elderly login with device token
      user = await User.findOne({ deviceToken });
      if (!user) {
        return res.status(401).json({ message: 'Invalid device token' });
      }
    } else {
      // Caregiver login or initial elderly setup
      if (role === 'caregiver') {
        user = await User.findOne({ caregiverPhone, caregiverName });
        if (!user || !(await user.matchPassword(password))) {
          return res.status(401).json({ message: 'Invalid phone or password' });
        }
      } else {
        // Elderly login with name and phone
        user = await User.findOne({ elderlyPhone: caregiverPhone, elderlyName: caregiverName });
        if (!user || !(await user.matchPassword(password))) {
          return res.status(401).json({ message: 'Invalid phone or password' });
        }
        // For elderly initial setup, generate device token
        if (!user.deviceToken) {
          user.deviceToken = generateToken(user._id) + '_device'; // Simple device token
          await user.save();
        }
      }
    }

    res.json({
      _id: user._id,
      elderlyName: user.elderlyName,
      caregiverName: user.caregiverName,
      preferredLanguage: user.preferredLanguage,
      role: role || 'caregiver',
      token: generateToken(user._id),
      deviceToken: user.deviceToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token (legacy)
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
  const { phone, password } = req.body;

  try {
    const user = await User.findOne({ elderlyPhone: phone });

    if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      elderlyName: user.elderlyName,
      elderlyEmail: user.elderlyEmail,
      caregiverName: user.caregiverName,
      preferredLanguage: user.preferredLanguage,
      token: generateToken(user._id),
    });
    } else {
      res.status(401).json({ message: 'Invalid phone or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const elderlyLogin = async (req, res) => {
  const { name, phone, password } = req.body;

  console.log('Elderly login attempt:', { name, phone, password });

  try {
    const user = await User.findOne({ elderlyName: name, elderlyPhone: phone });

    console.log('Found user:', user ? { elderlyName: user.elderlyName, elderlyPhone: user.elderlyPhone } : 'No user found');

    if (user && (await user.matchPassword(password))) {
      // Generate token
      const token = generateToken(user._id);
    res.json({
      _id: user._id,
      name: user.elderlyName,
      email: user.elderlyEmail,
      preferredLanguage: user.preferredLanguage,
      role: 'elderly',
      token,
    });
    } else {
      console.log('Login failed: invalid credentials');
      res.status(401).json({ message: 'Invalid name, phone or password' });
    }
  } catch (error) {
    console.log('Login error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send OTP
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTP = async (req, res) => {
  const { phone } = req.body;

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await User.findOneAndUpdate({ phone }, { otp, otpExpires });

    // In real app, send OTP via SMS
    console.log(`OTP for ${phone}: ${otp}`);

    res.json({ message: 'OTP sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;

  try {
    const user = await User.findOne({ phone });

    if (user && user.otp === otp && user.otpExpires > Date.now()) {
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid OTP' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  login,
  authUser,
  sendOTP,
  verifyOTP,
  elderlyLogin,
};

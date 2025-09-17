const User = require('../models/User');
const Medicine = require('../models/Medicine');
const { decrypt } = require('../middleware/encryption');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -otp -otpExpires');

    if (user.address) {
      user.address = decrypt(user.address, 'iv_placeholder'); // Need to store iv
    }
    if (user.medicalHistory) {
      user.medicalHistory = decrypt(user.medicalHistory, 'iv_placeholder');
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.address = req.body.address ? encrypt(req.body.address).encryptedData : user.address;
      user.medicalHistory = req.body.medicalHistory ? encrypt(req.body.medicalHistory).encryptedData : user.medicalHistory;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard data
// @route   GET /api/users/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  try {
    const medicines = await Medicine.find({ user: req.user._id });
    // Calculate adherence, etc.
    const adherence = 80; // Mock
    const recoveryGraph = []; // Mock

    res.json({
      medicines,
      adherence,
      recoveryGraph,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getDashboard,
};

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Elderly details
  elderlyName: {
    type: String,
    required: [true, 'Elderly name is required'],
  },
  elderlyAge: {
    type: Number,
    required: [true, 'Elderly age is required'],
  },
  elderlyPhone: {
    type: String,
    required: [true, 'Elderly phone is required'],
    unique: true,
  },
  elderlyEmail: {
    type: String,
    required: [true, 'Elderly email is required'],
  },
  // Caregiver details
  caregiverName: {
    type: String,
    required: [true, 'Caregiver name is required'],
  },
  caregiverPhone: {
    type: String,
    required: [true, 'Caregiver phone is required'],
    unique: true,
  },
  caregiverEmail: {
    type: String,
    required: [true, 'Caregiver email is required'],
  },
  preferredLanguage: {
    type: String,
    default: 'English',
  },
  // Auth
  password: {
    type: String,
    required: [true, 'Password is required'], // For caregiver
  },
  deviceToken: {
    type: String, // For elderly login-free
  },
  // Optional
  address: {
    type: String,
  },
  medicalHistory: {
    type: String,
  },
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

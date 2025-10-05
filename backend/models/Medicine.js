const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  dosage: {
    type: String,
    required: true,
  },
  times: {
    type: [String], // e.g., ['08:00', '20:00']
    required: true,
  },
  prescribedDays: {
    type: Number,
    required: true,
  },
  doctorContact: {
    type: String,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  taken: [{
    date: Date,
    time: String,
  }],
});

module.exports = mongoose.model('Medicine', medicineSchema);

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['medicine_taken', 'medicine_missed', 'sos_triggered', 'login', 'logout'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  metadata: {
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
    },
    medicineName: String,
    dosage: String,
    scheduledTime: String,
    location: {
      lat: Number,
      lng: Number,
    },
    contactsAlerted: Number,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Event', eventSchema);

const mongoose = require('mongoose');

const sosLogSchema = new mongoose.Schema({
  elderlyName: { type: String, required: true },
  caregiverPhone: { type: String, required: true },
  alertType: { type: String, enum: ['emergency', 'family'], default: 'emergency' },
  callStatus: { type: String },
  callSid: { type: String },
  smsResults: { type: Array, default: [] },
  error: { type: String },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SOSLog', sosLogSchema);

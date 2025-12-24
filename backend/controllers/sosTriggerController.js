const SOSLog = require('../models/SOSLog');
const EmergencyContact = require('../models/EmergencyContact');
const twilioClient = require('../utils/twilioClient');

// POST /api/sos/trigger
const triggerVoiceSOS = async (req, res) => {
  try {
    let { elderlyName, alertType = 'emergency', caregiverPhone } = req.body;

    // If the user is authenticated and didn't provide caregiverPhone, use their registered elderlyPhone
    if (req.user) {
      // prefer elderlyName from user profile
      elderlyName = elderlyName || req.user.elderlyName || `${req.user.caregiverName || 'User'}`;
      caregiverPhone = caregiverPhone || req.user.elderlyPhone || req.user.caregiverPhone;
    }

    if (!elderlyName) {
      return res.status(400).json({ message: 'elderlyName is required' });
    }

    if (!twilioClient) {
      return res.status(500).json({ message: 'Twilio is not configured on the server.' });
    }

    // Single target number per requirements: 9361106696 -> +919361106696
    const emergencyNumber = process.env.SOS_TARGET_NUMBER || '+919361106696';
    const from = process.env.TWILIO_PHONE_NUMBER;
    const twiml = `<Response><Say voice="alice" language="en-IN">Emergency alert from CareCircle. The elderly user is in an emergency situation. Please respond immediately.</Say></Response>`;

    try {
      // create a log entry for this SOS call
      const logEntry = await SOSLog.create({
        elderlyName,
        caregiverPhone: emergencyNumber,
        alertType,
        callStatus: 'pending',
      });

      const call = await twilioClient.calls.create({
        twiml,
        to: emergencyNumber,
        from,
      });

      await SOSLog.findByIdAndUpdate(logEntry._id, { callSid: call.sid, callStatus: 'initiated' });
      return res.json({ message: `Voice SOS initiated to ${emergencyNumber}`, result: { contact: emergencyNumber, status: 'called', sid: call.sid } });
    } catch (callError) {
      console.error('Twilio call error for single target:', callError);
      return res.status(500).json({ message: 'Failed to initiate SOS call', error: callError.message });
    }
  } catch (error) {
    console.error('triggerVoiceSOS error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  triggerVoiceSOS,
};

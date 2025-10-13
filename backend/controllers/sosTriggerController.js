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

    if (!elderlyName || !caregiverPhone) {
      return res.status(400).json({ message: 'elderlyName and caregiverPhone are required' });
    }

    // Normalize phone number: remove spaces, dashes, parentheses
    let normalized = String(caregiverPhone).replace(/[^0-9+]/g, '');
    // If no leading + and looks like 10 digits, assume Indian number and prepend +91
    const digits = normalized.replace(/[^0-9]/g, '');
    if (!normalized.startsWith('+') && digits.length === 10) {
      normalized = '+91' + digits;
    }
    // Final check: must start with + and have at least 10 digits
    const finalDigits = normalized.replace(/[^0-9]/g, '');
    if (!normalized.startsWith('+') || finalDigits.length < 10) {
      return res.status(400).json({ message: 'Invalid caregiverPhone format. Provide E.164 format e.g. +919876543210' });
    }
    caregiverPhone = normalized;

    if (!twilioClient) {
      return res.status(500).json({ message: 'Twilio is not configured on the server.' });
    }

  // Prepare TTS message (Indian English voice) - updated per request for clearer wording
  const text = `Hello. This is an emergency alert from CareCircle. Patient name: ${elderlyName}. They need immediate help.`;
  // Add a small pause using SSML break via <Break> is not supported in TwiML <Say>, but we can add punctuation to help clarity
  const twiml = `<Response><Say voice="alice" language="en-IN">${text}</Say></Response>`;

    // Make call(s) via Twilio
    const from = process.env.TWILIO_PHONE_NUMBER;

    // If this is an emergency and no single caregiverPhone was provided, fetch emergency contacts
    let targets = [];
    if (alertType === 'emergency' && !req.body.caregiverPhone) {
      try {
        const contacts = await EmergencyContact.find({ user: req.user._id });
        // Prefer to alert all contacts for emergency
        targets = contacts.map(c => ({ name: c.name, phone: c.phone, role: c.role }));
      } catch (err) {
        console.error('Failed to load emergency contacts:', err);
        return res.status(500).json({ message: 'Failed to load emergency contacts' });
      }
    }

    // If caregiverPhone is explicitly provided (or fallback), call that single number
    if (caregiverPhone && (targets.length === 0)) {
      targets = [{ name: caregiverPhone, phone: caregiverPhone, role: 'direct' }];
    }

    // Ensure ambulance number is always included in targets (config via env or fallback)
    const ambulancePhone = process.env.AMBULANCE_NUMBER || '9042662856';
    try {
      const ambulanceNormalizedCompare = String(ambulancePhone).replace(/[^0-9+]/g, '');
      if (!targets.some(t => (String(t.phone || '').replace(/[^0-9+]/g, '') === ambulanceNormalizedCompare))) {
        targets.push({ name: 'Ambulance', phone: ambulancePhone, role: 'ambulance' });
      }
    } catch (e) {
      // if anything odd happens, still continue without ambulance to avoid crashing
      console.warn('Failed to append ambulance number to targets:', e);
    }

    if (targets.length === 0) {
      // No targets found even after attempting to add ambulance
      return res.status(400).json({ message: 'No emergency contacts found to call.' });
    }

    const statusCallbackBase = `${process.env.BASE_URL || 'http://localhost:5000'}/api/twilio/status`;

    const callPromises = targets.map(async (target) => {
      const toPhoneRaw = target.phone;
      // Normalize per earlier logic
      let normalized = String(toPhoneRaw).replace(/[^0-9+]/g, '');
      const digits = normalized.replace(/[^0-9]/g, '');
      if (!normalized.startsWith('+') && digits.length === 10) normalized = '+91' + digits;
      const finalDigits = normalized.replace(/[^0-9]/g, '');
      if (!normalized.startsWith('+') || finalDigits.length < 10) {
        // create failed log for this contact
        const failedLog = await SOSLog.create({
          elderlyName,
          caregiverPhone: toPhoneRaw,
          alertType,
          callStatus: 'failed',
          error: JSON.stringify({ message: 'Invalid phone format' }),
        });
        return { contact: target.name, status: 'failed', error: 'Invalid phone format' };
      }

      // create a log entry BEFORE calling so we can reference it in the callback
      const logEntry = await SOSLog.create({
        elderlyName,
        caregiverPhone: normalized,
        alertType,
        callStatus: 'pending',
      });

      const statusCallbackUrl = `${statusCallbackBase}?logId=${logEntry._id}`;

      try {
        const call = await twilioClient.calls.create({
          twiml,
          to: normalized,
          from,
          statusCallback: statusCallbackUrl,
          statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        });
        // update log with callSid and mark initiated
        await SOSLog.findByIdAndUpdate(logEntry._id, { callSid: call.sid, callStatus: 'initiated' });
        return { contact: target.name, status: 'called', sid: call.sid };
      } catch (callError) {
        const errorInfo = {
          message: callError.message || 'Twilio call failed',
        };
        if (callError.code) errorInfo.code = callError.code;
        if (callError.moreInfo) errorInfo.moreInfo = callError.moreInfo;
        await SOSLog.findByIdAndUpdate(logEntry._id, { callStatus: 'failed', error: JSON.stringify(errorInfo) });
        console.error('Twilio call error for', normalized, errorInfo);
        return { contact: target.name, status: 'failed', error: errorInfo };
      }
    });

    const results = await Promise.all(callPromises);

    const successful = results.filter(r => r.status === 'called').length;
    return res.json({ message: `Voice SOS initiated for ${successful}/${targets.length} contacts.`, results });
  } catch (error) {
    console.error('triggerVoiceSOS error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  triggerVoiceSOS,
};

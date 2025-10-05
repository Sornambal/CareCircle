const User = require('../models/User');
const EmergencyContact = require('../models/EmergencyContact');
const twilio = require('twilio');

// Twilio configuration (add to environment variables)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = new twilio(accountSid, authToken);

// @desc    Trigger SOS
// @route   POST /api/sos/alert
// @access  Private
const triggerSOS = async (req, res) => {
  const { location, type = 'emergency' } = req.body; // { lat, lng }, type: 'emergency' or 'family'

  try {
    // Find emergency contacts
    let contacts = await EmergencyContact.find({ user: req.user._id });

    // Filter contacts based on type
    if (type === 'family') {
      // For family SOS, only send to caretaker and relative (exclude ambulance)
      contacts = contacts.filter(contact => contact.role !== 'ambulance');
    }
    // For emergency SOS, send to all contacts (ambulance, caretaker, relative)

    // Log the SOS event
    const Event = require('../models/Event');
    await Event.create({
      user: req.user._id,
      type: 'sos_triggered',
      description: `${type === 'emergency' ? 'Emergency' : 'Family'} SOS alert triggered`,
      metadata: {
        location,
        contactsAlerted: contacts.length,
        alertType: type,
      },
    });

    // Send SMS notifications to emergency contacts
    const smsPromises = contacts.map(async (contact) => {
      try {
        const alertTypeText = type === 'emergency' ? 'EMERGENCY ALERT' : 'FAMILY ALERT';
        const message = await client.messages.create({
          body: `${alertTypeText}: ${req.user.elderlyName} has triggered an SOS alert. Location: ${location?.lat || 'Unknown'}, ${location?.lng || 'Unknown'}. Please check on them immediately.`,
          from: twilioPhoneNumber,
          to: contact.phone,
        });
        console.log(`SMS sent to ${contact.name}: ${message.sid}`);
        return { contact: contact.name, status: 'sent', sid: message.sid };
      } catch (error) {
        console.error(`Failed to send SMS to ${contact.name}:`, error);
        return { contact: contact.name, status: 'failed', error: error.message };
      }
    });

    const smsResults = await Promise.all(smsPromises);
    const successfulSMS = smsResults.filter(result => result.status === 'sent').length;

    console.log(`${type === 'emergency' ? 'Emergency' : 'Family'} SOS triggered by ${req.user.elderlyName} at ${location?.lat}, ${location?.lng}`);
    console.log(`SMS alerts sent to ${successfulSMS}/${contacts.length} contacts`);

    res.json({
      message: `${type === 'emergency' ? 'Emergency' : 'Family'} SOS alert sent to ${successfulSMS} emergency contacts`,
      contactsAlerted: successfulSMS,
      smsResults,
      alertType: type,
      suggestions: type === 'emergency' ? ['Call nearest hospital', 'Contact emergency services'] : ['Check on family member', 'Contact local support'],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  triggerSOS,
};

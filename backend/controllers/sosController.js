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
      contacts = contacts.filter(contact => contact.role !== 'Private Ambulance');
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

    // Send SMS notifications to emergency contacts with multilingual support
    const smsPromises = contacts.map(async (contact) => {
      try {
        const alertTypeText = type === 'emergency' ? 'EMERGENCY ALERT' : 'FAMILY ALERT';

        // Get user's preferred language for SMS message
        const userPreferredLanguage = req.user.preferredLanguage || 'English';

        // Multilingual SMS messages
        const smsMessages = {
          English: `${alertTypeText}: ${req.user.elderlyName} has triggered an SOS alert. Location: ${location?.lat || 'Unknown'}, ${location?.lng || 'Unknown'}. Please check on them immediately.`,
          Tamil: `${alertTypeText}: ${req.user.elderlyName} ஒரு SOS எச்சரிக்கையைத் தூண்டியுள்ளார். இடம்: ${location?.lat || 'தெரியாது'}, ${location?.lng || 'தெரியாது'}. உடனடியாக அவர்களைச் சரிபார்க்கவும்.`,
          Hindi: `${alertTypeText}: ${req.user.elderlyName} ने SOS अलर्ट ट्रिगर किया है। स्थान: ${location?.lat || 'अज्ञात'}, ${location?.lng || 'अज्ञात'}। कृपया तुरंत उनकी जांच करें।`,
          Malayalam: `${alertTypeText}: ${req.user.elderlyName} ഒരു SOS അലേർട്ട് ട്രിഗർ ചെയ്തു. സ്ഥാനം: ${location?.lat || 'അജ്ഞാതം'}, ${location?.lng || 'അജ്ഞാതം'}। ഉടനെ അവരെ പരിശോധിക്കുക.`,
        };

        const messageBody = smsMessages[userPreferredLanguage] || smsMessages.English;

        const message = await client.messages.create({
          body: messageBody,
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

    // Send voice calls for emergency SOS only
    let voiceResults = [];
    if (type === 'emergency') {
      const voicePromises = contacts.map(async (contact) => {
        try {
          const alertTypeText = 'EMERGENCY ALERT';

          // Get user's preferred language for voice message
          const userPreferredLanguage = req.user.preferredLanguage || 'English';

          // Multilingual voice messages
          const voiceMessages = {
            English: `Emergency alert. ${req.user.elderlyName} has triggered an SOS alert. Location: ${location?.lat || 'Unknown'}, ${location?.lng || 'Unknown'}. Please check on them immediately.`,
            Tamil: `அவசர எச்சரிக்கை. ${req.user.elderlyName} ஒரு SOS எச்சரிக்கையைத் தூண்டியுள்ளார். இடம்: ${location?.lat || 'தெரியாது'}, ${location?.lng || 'தெரியாது'}. உடனடியாக அவர்களைச் சரிபார்க்கவும்.`,
            Hindi: `आपातकालीन अलर्ट। ${req.user.elderlyName} ने SOS अलर्ट ट्रिगर किया है। स्थान: ${location?.lat || 'अज्ञात'}, ${location?.lng || 'अज्ञात'}। कृपया तुरंत उनकी जांच करें।`,
            Malayalam: `അടിയന്തര അലേർട്ട്. ${req.user.elderlyName} ഒരു SOS അലേർട്ട് ട്രിഗർ ചെയ്തു. സ്ഥാനം: ${location?.lat || 'അജ്ഞാതം'}, ${location?.lng || 'അജ്ഞാതം'}। ഉടനെ അവരെ പരിശോധിക്കുക.`,
          };

          const voiceMessage = voiceMessages[userPreferredLanguage] || voiceMessages.English;

          // Create TwiML for voice call
          const twiml = `<Response><Say voice="alice" language="${userPreferredLanguage === 'Tamil' ? 'ta-IN' : userPreferredLanguage === 'Hindi' ? 'hi-IN' : userPreferredLanguage === 'Malayalam' ? 'ml-IN' : 'en-IN'}">${voiceMessage}</Say></Response>`;

          const call = await client.calls.create({
            twiml: twiml,
            to: contact.phone,
            from: twilioPhoneNumber,
          });

          console.log(`Voice call initiated to ${contact.name}: ${call.sid}`);
          return { contact: contact.name, status: 'called', sid: call.sid };
        } catch (error) {
          console.error(`Failed to initiate voice call to ${contact.name}:`, error);
          return { contact: contact.name, status: 'failed', error: error.message };
        }
      });

      voiceResults = await Promise.all(voicePromises);
    }

    const successfulVoice = voiceResults.filter(result => result.status === 'called').length;

    console.log(`${type === 'emergency' ? 'Emergency' : 'Family'} SOS triggered by ${req.user.elderlyName} at ${location?.lat}, ${location?.lng}`);
    console.log(`SMS alerts sent to ${successfulSMS}/${contacts.length} contacts`);
    if (type === 'emergency') {
      console.log(`Voice calls initiated to ${successfulVoice}/${contacts.length} contacts`);
    }

    // Send real-time notification to caregiver dashboard
    const io = req.app.get('io');
    if (io) {
      const notificationData = {
        type: 'sos_alert',
        alertType: type,
        elderlyName: req.user.elderlyName,
        location: location,
        timestamp: new Date(),
        contactsAlerted: successfulSMS,
        message: `${type === 'emergency' ? 'EMERGENCY' : 'FAMILY'} SOS alert from ${req.user.elderlyName}`,
        details: {
          smsSent: successfulSMS,
          voiceCalls: successfulVoice,
          totalContacts: contacts.length
        }
      };

      // Emit to caregiver's room (assuming caregiver is logged in with the same user ID)
      io.to(`user_${req.user._id}`).emit('sos-notification', notificationData);
      console.log(`Real-time SOS notification sent to caregiver for user ${req.user._id}`);
    }

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

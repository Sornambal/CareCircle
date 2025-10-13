const twilio = require('twilio');

// Initialize Twilio client using environment variables.
// Make sure to set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER in your .env
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

let client = null;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
} else {
  console.warn('Twilio credentials not configured. Voice/SMS will not work until TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set.');
}

module.exports = client;

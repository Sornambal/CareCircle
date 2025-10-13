const SOSLog = require('../models/SOSLog');

// Twilio will POST status updates here as application/x-www-form-urlencoded
const handleStatusCallback = async (req, res) => {
  try {
    const { CallSid, CallStatus } = req.body;
    const { logId } = req.query;
    if (logId) {
      const log = await SOSLog.findByIdAndUpdate(logId, { callStatus: CallStatus, callSid: CallSid }, { new: true });
      if (!log) console.warn('No SOSLog found for logId', logId);
      else console.log('Updated SOSLog by logId', log._id, 'to status', CallStatus);
    } else if (CallSid) {
      const log = await SOSLog.findOneAndUpdate({ callSid: CallSid }, { callStatus: CallStatus }, { new: true });
      if (!log) console.warn('No SOSLog found for CallSid', CallSid);
      else console.log('Updated SOSLog', log._id, 'to status', CallStatus);
    } else {
      console.warn('Twilio callback received without CallSid or logId');
    }

    // Twilio expects a 200 OK
    res.status(200).send('OK');
  } catch (error) {
    console.error('handleStatusCallback error', error);
    res.status(500).send('Server Error');
  }
};

module.exports = { handleStatusCallback };

const User = require('../models/User');

// @desc    Trigger SOS
// @route   POST /api/sos
// @access  Private
const triggerSOS = async (req, res) => {
  const { location } = req.body; // { lat, lng }

  try {
    // Find helpers
    const helpers = await User.find({ role: 'helper' });

    // In real app, send notifications to helpers
    console.log(`SOS triggered by ${req.user.name} at ${location.lat}, ${location.lng}`);

    // Mock response
    res.json({
      message: 'SOS alert sent to helpers',
      suggestions: ['Call nearest hospital', 'Contact emergency services'],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  triggerSOS,
};

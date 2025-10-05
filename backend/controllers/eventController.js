const Event = require('../models/Event');

// @desc    Get user events
// @route   GET /api/events
// @access  Private
const getEvents = async (req, res) => {
  try {
    const { type, limit = 50, page = 1 } = req.query;
    const query = { user: req.user._id };

    if (type) {
      query.type = type;
    }

    const events = await Event.find(query)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('metadata.medicineId');

    const total = await Event.countDocuments(query);

    res.json({
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Log medicine taken event
// @route   POST /api/events/medicine-taken
// @access  Private
const logMedicineTaken = async (req, res) => {
  const { medicineId, medicineName, dosage, scheduledTime } = req.body;

  try {
    const event = await Event.create({
      user: req.user._id,
      type: 'medicine_taken',
      description: `Took ${medicineName} (${dosage}) at ${scheduledTime}`,
      metadata: {
        medicineId,
        medicineName,
        dosage,
        scheduledTime,
      },
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Log medicine missed event
// @route   POST /api/events/medicine-missed
// @access  Private
const logMedicineMissed = async (req, res) => {
  const { medicineId, medicineName, dosage, scheduledTime } = req.body;

  try {
    const event = await Event.create({
      user: req.user._id,
      type: 'medicine_missed',
      description: `Missed ${medicineName} (${dosage}) scheduled for ${scheduledTime}`,
      metadata: {
        medicineId,
        medicineName,
        dosage,
        scheduledTime,
      },
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Log SOS triggered event
// @route   POST /api/events/sos-triggered
// @access  Private
const logSOSTriggered = async (req, res) => {
  const { location, contactsAlerted } = req.body;

  try {
    const event = await Event.create({
      user: req.user._id,
      type: 'sos_triggered',
      description: `SOS alert triggered`,
      metadata: {
        location,
        contactsAlerted,
      },
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Log user login event
// @route   POST /api/events/login
// @access  Private
const logLogin = async (req, res) => {
  try {
    const event = await Event.create({
      user: req.user._id,
      type: 'login',
      description: `${req.user.role === 'elderly' ? 'Elderly user' : 'Caregiver'} logged in`,
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Log user logout event
// @route   POST /api/events/logout
// @access  Private
const logLogout = async (req, res) => {
  try {
    const event = await Event.create({
      user: req.user._id,
      type: 'logout',
      description: `${req.user.role === 'elderly' ? 'Elderly user' : 'Caregiver'} logged out`,
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEvents,
  logMedicineTaken,
  logMedicineMissed,
  logSOSTriggered,
  logLogin,
  logLogout,
};

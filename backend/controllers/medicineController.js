const Medicine = require('../models/Medicine');
const { createWorker } = require('tesseract.js');

// @desc    Get user medicines
// @route   GET /api/medicines
// @access  Private
const getMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({ user: req.user._id });
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add new medicine
// @route   POST /api/medicines
// @access  Private
const addMedicine = async (req, res) => {
  const { name, dosage, times, prescribedDays, doctorContact } = req.body;

  try {
    const medicine = await Medicine.create({
      user: req.user._id,
      name,
      dosage,
      times,
      prescribedDays,
      doctorContact,
    });

    res.status(201).json(medicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Scan prescription using OCR
// @route   POST /api/medicines/ocr
// @access  Private
const scanPrescription = async (req, res) => {
  try {
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(req.file.path);
    await worker.terminate();

    // Parse OCR text to extract medicine details (simplified)
    const lines = text.split('\n').filter(line => line.trim());
    const medicineData = {
      name: lines[0] || 'Unknown Medicine',
      dosage: 'As prescribed',
      times: ['08:00', '20:00'], // Default times
      prescribedDays: 30,
      doctorContact: 'Doctor contact not found',
    };

    res.json({ extractedText: text, medicineData });
  } catch (error) {
    res.status(500).json({ message: 'OCR processing failed' });
  }
};

// @desc    Mark medicine as taken
// @route   PUT /api/medicines/:id/taken
// @access  Private
const markTaken = async (req, res) => {
  const { time } = req.body;

  try {
    const medicine = await Medicine.findById(req.params.id);

    if (medicine && medicine.user.toString() === req.user._id.toString()) {
      const today = new Date().toISOString().slice(0, 10);
      const existingEntry = medicine.taken.find(entry =>
        entry.date.toISOString().slice(0, 10) === today && entry.time === time
      );

      if (!existingEntry) {
        medicine.taken.push({ date: new Date(), time });
        medicine.lastTaken = new Date();
        medicine.takenToday = true;
        await medicine.save();
      }

      res.json(medicine);
    } else {
      res.status(404).json({ message: 'Medicine not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get missed medicines
// @route   GET /api/medicines/missed
// @access  Private
const getMissedMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({ user: req.user._id });
    const today = new Date();
    const missed = [];

    medicines.forEach(medicine => {
      const startDate = new Date(medicine.startDate);
      const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

      if (daysSinceStart < medicine.prescribedDays) {
        const expectedDoses = medicine.times.length * (daysSinceStart + 1);
        const actualDoses = medicine.taken.length;
        if (actualDoses < expectedDoses) {
          missed.push(medicine);
        }
      }
    });

    res.json(missed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get today's medicines
// @route   GET /api/medicines/today
// @access  Private
const getTodaysMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({ user: req.user._id });
    const today = new Date();
    const todaysMedicines = [];

    medicines.forEach(medicine => {
      const startDate = new Date(medicine.startDate);
      const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

      if (daysSinceStart < medicine.prescribedDays) {
        const scheduledTimes = medicine.times.map(time => ({
          time,
          status: medicine.taken.some(entry =>
            entry.date.toISOString().slice(0, 10) === today.toISOString().slice(0, 10) &&
            entry.time === time
          ) ? 'taken' : 'pending'
        }));

        todaysMedicines.push({
          ...medicine.toObject(),
          scheduledTimes
        });
      }
    });

    res.json(todaysMedicines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send reminder for medicine
// @route   POST /api/medicines/:id/reminder
// @access  Private
const sendReminder = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (medicine && medicine.user.toString() === req.user._id.toString()) {
      // In a real app, this would send an actual notification/email/SMS
      medicine.lastReminderSent = new Date();
      medicine.reminderCount += 1;
      await medicine.save();

      res.json({ message: 'Reminder sent successfully' });
    } else {
      res.status(404).json({ message: 'Medicine not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check and send reminders
// @route   POST /api/medicines/check-reminders
// @access  Private
const checkReminders = async (req, res) => {
  try {
    const medicines = await Medicine.find({ user: req.user._id });
    const now = new Date();
    const remindersSent = [];

    for (const medicine of medicines) {
      const todaysMedicines = await getTodaysMedicines({ user: req.user });
      const pendingDoses = todaysMedicines.find(m => m._id.toString() === medicine._id.toString())
        ?.scheduledTimes.filter(st => st.status === 'pending') || [];

      if (pendingDoses.length > 0) {
        const lastReminder = medicine.lastReminderSent;
        const hoursSinceLastReminder = lastReminder ? (now - lastReminder) / (1000 * 60 * 60) : 24;

        if (hoursSinceLastReminder >= 2) { // Send reminder every 2 hours if doses pending
          await sendReminder({ params: { id: medicine._id }, user: req.user }, { json: () => {} });
          remindersSent.push(medicine.name);
        }
      }
    }

    res.json({ message: `Reminders sent for: ${remindersSent.join(', ')}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update medicine
// @route   PUT /api/medicines/:id
// @access  Private
const updateMedicine = async (req, res) => {
  const { name, dosage, times, prescribedDays, doctorContact } = req.body;

  try {
    const medicine = await Medicine.findById(req.params.id);

    if (medicine && medicine.user.toString() === req.user._id.toString()) {
      medicine.name = name || medicine.name;
      medicine.dosage = dosage || medicine.dosage;
      medicine.times = times || medicine.times;
      medicine.prescribedDays = prescribedDays || medicine.prescribedDays;
      medicine.doctorContact = doctorContact || medicine.doctorContact;

      const updatedMedicine = await medicine.save();
      res.json(updatedMedicine);
    } else {
      res.status(404).json({ message: 'Medicine not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete medicine
// @route   DELETE /api/medicines/:id
// @access  Private
const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (medicine && medicine.user.toString() === req.user._id.toString()) {
      await medicine.deleteOne();
      res.json({ message: 'Medicine removed' });
    } else {
      res.status(404).json({ message: 'Medicine not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMedicines,
  addMedicine,
  scanPrescription,
  markTaken,
  getMissedMedicines,
  getTodaysMedicines,
  sendReminder,
  checkReminders,
  updateMedicine,
  deleteMedicine,
};

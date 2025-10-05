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

// @desc    Add medicine
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

// @desc    OCR scan prescription
// @route   POST /api/medicines/ocr
// @access  Private
const scanPrescription = async (req, res) => {
  try {
    const worker = createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(req.file.path);
    await worker.terminate();

    // Mock extraction
    const extracted = {
      name: 'Paracetamol',
      dosage: '500mg',
      time: 'after food',
      prescribedDays: 7,
      doctorContact: 'Dr. Smith - 1234567890',
    };

    res.json({ extracted, rawText: text });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark medicine as taken
// @route   PUT /api/medicines/:id/taken
// @access  Private
const markTaken = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (medicine) {
      const takenTime = req.body.time || new Date().toLocaleTimeString();
      medicine.taken.push({ date: new Date(), time: takenTime });
      await medicine.save();

      // Log the event
      const Event = require('../models/Event');
      await Event.create({
        user: req.user._id,
        type: 'medicine_taken',
        description: `Took ${medicine.name} (${medicine.dosage}) at ${takenTime}`,
        metadata: {
          medicineId: medicine._id,
          medicineName: medicine.name,
          dosage: medicine.dosage,
          scheduledTime: takenTime,
        },
      });

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
    const now = new Date();
    const today = now.toDateString();
    const currentHour = now.getHours();

    const missed = medicines.filter(med => {
      return med.times.some(time => {
        const medHour = parseInt(time.split(':')[0]);
        const takenToday = med.taken.some(t => new Date(t.date).toDateString() === today && t.time === time);
        return !takenToday && medHour <= currentHour;
      });
    });

    res.json(missed);
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
};

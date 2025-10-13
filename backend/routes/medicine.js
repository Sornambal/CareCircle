const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
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
} = require('../controllers/medicineController');
const { protect } = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

router.route('/').get(protect, getMedicines).post(protect, addMedicine);
router.route('/:id/taken').put(protect, markTaken);
router.route('/:id').put(protect, updateMedicine).delete(protect, deleteMedicine);
router.route('/ocr').post(protect, upload.single('prescription'), scanPrescription);
router.route('/missed').get(protect, getMissedMedicines);
router.route('/today').get(protect, getTodaysMedicines);
router.route('/:id/reminder').post(protect, sendReminder);
router.route('/check-reminders').post(protect, checkReminders);

module.exports = router;

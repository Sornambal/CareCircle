const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getMedicines,
  addMedicine,
  scanPrescription,
  markTaken,
  getMissedMedicines,
} = require('../controllers/medicineController');
const { protect } = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

router.route('/').get(protect, getMedicines).post(protect, addMedicine);
router.route('/:id/taken').put(protect, markTaken);
router.route('/ocr').post(protect, upload.single('prescription'), scanPrescription);
router.route('/missed').get(protect, getMissedMedicines);

module.exports = router;

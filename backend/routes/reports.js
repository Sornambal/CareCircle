const express = require('express');
const router = express.Router();
const {
  getMedicationAdherence,
  getActivitySummary,
  getRecoveryProgress,
} = require('../controllers/reportController');

const { protect } = require('../middleware/auth');

router.route('/medication-adherence').get(protect, getMedicationAdherence);
router.route('/activity-summary').get(protect, getActivitySummary);
router.route('/recovery-progress').get(protect, getRecoveryProgress);

module.exports = router;

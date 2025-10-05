const express = require('express');
const router = express.Router();
const {
  getEvents,
  logMedicineTaken,
  logMedicineMissed,
  logSOSTriggered,
  logLogin,
  logLogout,
} = require('../controllers/eventController');

const { protect } = require('../middleware/auth');

router.route('/').get(protect, getEvents);
router.route('/medicine-taken').post(protect, logMedicineTaken);
router.route('/medicine-missed').post(protect, logMedicineMissed);
router.route('/sos-triggered').post(protect, logSOSTriggered);
router.route('/login').post(protect, logLogin);
router.route('/logout').post(protect, logLogout);

module.exports = router;

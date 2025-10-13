const express = require('express');
const router = express.Router();
const {
  getEmergencyContacts,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
} = require('../controllers/emergencyContactController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getEmergencyContacts)
  .post(protect, addEmergencyContact);

router.route('/:id')
  .put(protect, updateEmergencyContact)
  .delete(protect, deleteEmergencyContact);

module.exports = router;

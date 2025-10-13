const EmergencyContact = require('../models/EmergencyContact');

// @desc    Get user emergency contacts
// @route   GET /api/emergency-contacts
// @access  Private
const getEmergencyContacts = async (req, res) => {
  try {
    const contacts = await EmergencyContact.find({ user: req.user._id });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add emergency contact
// @route   POST /api/emergency-contacts
// @access  Private
const addEmergencyContact = async (req, res) => {
  const { name, phone, email, role } = req.body;

  try {
    const contact = await EmergencyContact.create({
      user: req.user._id,
      name,
      phone,
      email,
      role,
    });

    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update emergency contact
// @route   PUT /api/emergency-contacts/:id
// @access  Private
const updateEmergencyContact = async (req, res) => {
  const { name, phone, email, role } = req.body;

  try {
    const contact = await EmergencyContact.findById(req.params.id);

    if (contact && contact.user.toString() === req.user._id.toString()) {
      contact.name = name || contact.name;
      contact.phone = phone || contact.phone;
      contact.email = email || contact.email;
      contact.role = role || contact.role;

      const updatedContact = await contact.save();
      res.json(updatedContact);
    } else {
      res.status(404).json({ message: 'Contact not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete emergency contact
// @route   DELETE /api/emergency-contacts/:id
// @access  Private
const deleteEmergencyContact = async (req, res) => {
  try {
    const contact = await EmergencyContact.findById(req.params.id);

    if (contact && contact.user.toString() === req.user._id.toString()) {
      await contact.deleteOne();
      res.json({ message: 'Contact removed' });
    } else {
      res.status(404).json({ message: 'Contact not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEmergencyContacts,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
};

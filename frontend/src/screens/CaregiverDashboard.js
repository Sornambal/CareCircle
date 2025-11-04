import React, { useEffect, useState } from 'react';
import MedicineCard from '../components/MedicineCard';
import ReportCard from '../components/ReportCard';
import RecoveryGraph from '../components/RecoveryGraph';
import ProfileCard from '../components/ProfileCard';
import Header from '../components/Header';
import useMultilingualNotifications from '../hooks/useMultilingualNotifications';
import usePWAInstall from '../hooks/usePWAInstall';
import {
  fetchMedicines, addMedicine, getTodaysMedicines, markMedicineTaken,
  updateMedicine, deleteMedicine, getEmergencyContacts, addEmergencyContact,
  updateEmergencyContact, deleteEmergencyContact
} from '../utils/api';
import {
  Box, Typography, CircularProgress, Alert, Grid, Button, Modal, TextField,
  MenuItem, FormControl, InputLabel, Select, AppBar, Toolbar, Dialog,
  DialogTitle, DialogContent, DialogActions, Card, CardContent
} from '@mui/material';
import {
  Medication, AccessTime, Person, LocalHospital, Favorite
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import './CaregiverDashboard.css';

const CaregiverDashboard = () => {
  const { t, i18n } = useTranslation();
  const [medicines, setMedicines] = useState([]);
  const [todaysMedicines, setTodaysMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    dosage: '',
    times: '',
    prescribedDays: '',
    doctorContact: '',
  });
  const [editingMedicineId, setEditingMedicineId] = useState(null);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
    role: '',
  });
  const [editingContactId, setEditingContactId] = useState(null);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [reminderDialog, setReminderDialog] = useState({ open: false, medicine: null, scheduledTime: null });
  const [currentTime, setCurrentTime] = useState(new Date());

  const { isInstallable, installPWA } = usePWAInstall();

  const token = localStorage.getItem('token');
  const [user, setUser] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  });

  // Language mapping from full names to i18n codes
  const languageMap = {
    'English': 'en',
    'Tamil': 'ta',
    'Telugu': 'te',
    'Hindi': 'hi',
    'Malayalam': 'ml'
  };

  const language = languageMap[user?.preferredLanguage] || 'en';

  const handleLanguageChange = (newLang) => {
    const updatedUser = { ...(user || {}), preferredLanguage: newLang };
    setUser(updatedUser);
    try {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (e) {
      console.warn('Failed to persist user language preference', e);
    }
    // Update i18n language immediately
    i18n.changeLanguage(languageMap[newLang] || 'en');
  };

  useEffect(() => {
    i18n.changeLanguage(language); // Set language for i18n
  }, [language, i18n]);

  useEffect(() => {
    const loadMedicines = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetchMedicines(token);
        setMedicines(response.data || []);
      } catch (err) {
        setError('Failed to load medicines');
      }
      setLoading(false);
    };
    if (user && token) {
      loadMedicines();
    }

    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted');
        } else {
          console.log('Notification permission denied');
        }
      });
    }
  }, [token]);

  useEffect(() => {
    const fetchTodaysMedicines = async () => {
      try {
        if (token) {
          const response = await getTodaysMedicines(token);
          setTodaysMedicines(response.data || []);
        }
      } catch (error) {
        console.error('Error fetching today\'s medicines:', error);
      }
    };

    fetchTodaysMedicines();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [token]);

  const handleTakeMedicine = async (medicineId, scheduledTime) => {
    try {
      if (token) {
        await markMedicineTaken(medicineId, { time: scheduledTime }, token);
        const response = await getTodaysMedicines(token);
        setTodaysMedicines(response.data || []);
      }
      setReminderDialog({ open: false, medicine: null, scheduledTime: null });
    } catch (error) {
      console.error('Error marking medicine as taken:', error);
    }
  };

  const { triggerDemoNotification, testVoiceSupport } = useMultilingualNotifications(todaysMedicines, user, token, handleTakeMedicine);

  const calculateAdherence = () => {
    if (medicines.length === 0) return 0;
    return 80;
  };

  const recoveryData = [
    { date: 'Day 1', recovery: 20 },
    { date: 'Day 3', recovery: 40 },
    { date: 'Day 5', recovery: 60 },
    { date: 'Day 7', recovery: 80 },
    { date: 'Day 10', recovery: 90 },
    { date: 'Day 14', recovery: 100 },
  ];

  const handleOpenModal = () => setModalOpen(true);

  const handleCloseModal = () => {
    setModalOpen(false);
    setNewMedicine({
      name: '',
      dosage: '',
      times: '',
      prescribedDays: '',
      doctorContact: '',
    });
    setEditingMedicineId(null);
  };

  const handleInputChange = (e) => {
    setNewMedicine({ ...newMedicine, [e.target.name]: e.target.value });
  };

  const handleSaveMedicine = async () => {
    if (!newMedicine.name || !newMedicine.dosage || !newMedicine.times || !newMedicine.prescribedDays) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const medicineData = {
        name: newMedicine.name,
        dosage: String(newMedicine.dosage),
        times: newMedicine.times.split(',').map(time => time.trim()),
        prescribedDays: parseInt(newMedicine.prescribedDays, 10),
        doctorContact: newMedicine.doctorContact,
      };
      if (editingMedicineId) {
        await updateMedicine(editingMedicineId, medicineData, token);
      } else {
        await addMedicine(medicineData, token);
      }
      handleCloseModal();
      const response = await fetchMedicines(token);
      setMedicines(response.data || []);
    } catch (err) {
      console.error('Save medicine error:', err);
      const message = err.response?.data?.message || 'Failed to save medicine';
      alert(message);
    }
  };

  const handleContactInputChange = (e) => {
    setNewContact({ ...newContact, [e.target.name]: e.target.value });
  };

  const handleSaveContact = async () => {
    if (!newContact.name || !newContact.phone || !newContact.email || !newContact.role) {
      alert('Please fill all fields');
      return;
    }
    try {
      if (editingContactId) {
        await updateEmergencyContact(editingContactId, newContact, token);
      } else {
        await addEmergencyContact(newContact, token);
      }
      const contacts = await getEmergencyContacts(token);
      setEmergencyContacts(contacts.data || []);
      setContactModalOpen(false);
      setNewContact({ name: '', phone: '', email: '', role: '' });
      setEditingContactId(null);
    } catch (error) {
      console.error('Save contact error:', error);
      const message = error.response?.data?.message || 'Failed to save contact';
      alert(message);
    }
  };

  const handleCloseContactModal = () => {
    setContactModalOpen(false);
    setNewContact({ name: '', phone: '', email: '', role: '' });
    setEditingContactId(null);
  };

  const handleEditMedicine = (medicine) => {
    setNewMedicine({
      name: medicine.name,
      dosage: medicine.dosage,
      times: Array.isArray(medicine.times) ? medicine.times.join(', ') : (medicine.time || ''),
      prescribedDays: medicine.prescribedDays,
      doctorContact: medicine.doctorContact,
    });
    setEditingMedicineId(medicine._id);
    setModalOpen(true);
  };

  const handleDeleteMedicine = async (id) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      try {
        await deleteMedicine(id, token);
        const response = await fetchMedicines(token);
        setMedicines(response.data || []);
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete medicine');
      }
    }
  };

  const handleEditContact = (contact) => {
    setNewContact({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      role: contact.role,
    });
    setEditingContactId(contact._id);
    setContactModalOpen(true);
  };

  const handleDeleteContact = async (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await deleteEmergencyContact(id, token);
        const contacts = await getEmergencyContacts(token);
        setEmergencyContacts(contacts.data || []);
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete contact');
      }
    }
  };

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const contacts = await getEmergencyContacts(token);
        setEmergencyContacts(contacts.data || []);
      } catch (error) {
        console.error('Failed to load emergency contacts', error);
      }
    };
    if (token) {
      loadContacts();
    }
  }, [token]);

  const handleDownloadReport = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/reports/generate-pdf?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to generate PDF report');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `carecircle-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF report:', error);
      alert('Failed to download PDF report. Please try again.');
    }
  };

  return (
    <>
      <Header />
      <Box className="caregiver-dashboard">
        <Box className="caregiver-dashboard__content">
          <ProfileCard user={user} />
          {/* Caregiver Quick Actions */}
          <Card className="caregiver-dashboard__quick-actions">
            <CardContent className="caregiver-dashboard__quick-actions-content">
              <Typography variant="h6" gutterBottom className="caregiver-dashboard__quick-actions-title">
                <Person className="caregiver-dashboard__section-icon" />
                {t('quickActions')}
              </Typography>
              <Box className="caregiver-dashboard__quick-actions-buttons">
                <Button
                  variant="contained"
                  startIcon={<Medication />}
                  onClick={handleOpenModal}
                  className="caregiver-dashboard__btn-add-medicine"
                  fullWidth
                >
                  {t('addMedicine')}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<LocalHospital />}
                  onClick={() => setContactModalOpen(true)}
                  className="caregiver-dashboard__btn-add-contact"
                  fullWidth
                >
                  {t('addEmergencyContact')}
                </Button>
              </Box>
            </CardContent>
          </Card>
          {/* Loading and Error States */}
          {loading && (
            <Card className="caregiver-dashboard__loading-state">
              <CircularProgress className="caregiver-dashboard__loading-spinner" />
              <Typography className="caregiver-dashboard__loading-text">{t('loadingHealth')}</Typography>
            </Card>
          )}
          {error && (
            <Alert severity="error" className="caregiver-dashboard__error-alert">{error}</Alert>
          )}
          {/* Current Time Display */}
          <Card className="caregiver-dashboard__time-card">
            <CardContent className="caregiver-dashboard__time-card-content">
              <AccessTime className="caregiver-dashboard__time-icon" />
              <Typography variant="h3" className="caregiver-dashboard__time-value">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
              <Typography variant="h6" className="caregiver-dashboard__date-value">
                {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
            </CardContent>
          </Card>
          {/* Today's Medications Section */}
          <Card className="caregiver-dashboard__medications">
            <CardContent className="caregiver-dashboard__medications-content">
              <Typography variant="h5" gutterBottom className="caregiver-dashboard__medications-title">
                <Medication className="caregiver-dashboard__section-icon" />
                {t('todaysMedications')}
              </Typography>
              {todaysMedicines.length > 0 ? (
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  {todaysMedicines.map((med) => (
                    <Grid item xs={12} sm={6} md={4} key={med._id}>
                      <Card variant="outlined" className="caregiver-dashboard__medicine-card">
                        <CardContent className="caregiver-dashboard__medicine-card-content">
                          <MedicineCard medicine={med} onMarkTaken={handleTakeMedicine} />
                          <Box className="caregiver-dashboard__medicine-actions">
                            <Box className="caregiver-dashboard__medicine-edit-actions">
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleEditMedicine(med)}
                                className="caregiver-dashboard__btn-medicine-edit"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                color="error"
                                onClick={() => handleDeleteMedicine(med._id)}
                                className="caregiver-dashboard__btn-medicine-delete"
                              >
                                Delete
                              </Button>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box className="caregiver-dashboard__no-medications">
                  <Typography variant="h6" className="caregiver-dashboard__no-medications-title">
                    🎉 {t('noMedications')}
                  </Typography>
                  <Typography variant="body1" className="caregiver-dashboard__no-medications-text">
                    {t('enjoyDay')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
          {/* Medication Reminder Dialog */}
          <Dialog
            open={reminderDialog.open}
            onClose={() => setReminderDialog({ open: false, medicine: null, scheduledTime: null })}
            fullWidth
            maxWidth="sm"
            className="caregiver-dashboard__reminder-modal"
          >
            <DialogTitle className="caregiver-dashboard__reminder-modal-title">
              {t('medicationReminder')}
            </DialogTitle>
            <DialogContent>
              <Typography variant="h6" className="caregiver-dashboard__reminder-medicine-name">
                {t('timeToTake')} {reminderDialog.medicine?.name}
              </Typography>
              <Typography variant="body1" className="caregiver-dashboard__reminder-dosage">
                {t('dosage')} {reminderDialog.medicine?.dosage}
              </Typography>
              <Typography variant="body2" color="textSecondary" className="caregiver-dashboard__reminder-time">
                {t('scheduledTime')} {reminderDialog.scheduledTime}
              </Typography>
              <Button
                onClick={() => triggerDemoNotification(reminderDialog.medicine)}
                variant="outlined"
                color="secondary"
                fullWidth
                className="caregiver-dashboard__test-notification-btn"
              >
                {t('testNotification')} ({user?.preferredLanguage || 'English'})
              </Button>
            </DialogContent>
            <DialogActions className="caregiver-dashboard__reminder-actions">
              <Button
                onClick={() => handleTakeMedicine(reminderDialog.medicine?._id, reminderDialog.scheduledTime)}
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                className="caregiver-dashboard__reminder-taken-btn"
              >
                {t('takenIt')}
              </Button>
            </DialogActions>
          </Dialog>
          {/* Caregiver Sections */}
          <Typography variant="h6" gutterBottom className="caregiver-dashboard__section-heading">
            {t('emergencyContacts')}
          </Typography>
          <Grid container spacing={{ xs: 2, sm: 2 }} className="caregiver-dashboard__contacts-grid">
            {emergencyContacts.map((contact) => (
              <Grid item xs={12} sm={6} md={4} key={contact._id}>
                <Box className="caregiver-dashboard__contact-card">
                  <Typography variant="h6" className="caregiver-dashboard__contact-name">{contact.name}</Typography>
                  <Typography className="caregiver-dashboard__contact-info">Phone: {contact.phone}</Typography>
                  <Typography className="caregiver-dashboard__contact-info">Email: {contact.email}</Typography>
                  <Typography className="caregiver-dashboard__contact-info">Role: {contact.role}</Typography>
                  <Box className="caregiver-dashboard__contact-actions">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleEditContact(contact)}
                      fullWidth
                      className="caregiver-dashboard__btn-contact-edit"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() => handleDeleteContact(contact._id)}
                      fullWidth
                      className="caregiver-dashboard__btn-contact-delete"
                    >
                      Delete
                    </Button>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
          <Typography variant="h6" gutterBottom className="caregiver-dashboard__section-heading">
            {t('reportTracking')}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleDownloadReport}
            fullWidth
            className="caregiver-dashboard__btn-download-report"
          >
            {t('downloadReport')}
          </Button>
          <ReportCard adherence={calculateAdherence()} />
          {/* Medicine Taken Report Table */}
          <Box className="caregiver-dashboard__report-table-wrapper">
            <table className="caregiver-dashboard__report-table">
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Before/After Food</th>
                  <th>Taken Today</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((med) => {
                  const today = new Date().toISOString().slice(0, 10);
                  const takenToday = med.taken.some(t => t.date && t.date.slice(0, 10) === today);
                  const beforeAfterFood = med.time && med.time.includes('Before Food') ? 'Before Food' :
                    med.time && med.time.includes('After Food') ? 'After Food' : '';

                  return (
                    <tr key={med._id}>
                      <td>{med.name}</td>
                      <td>{beforeAfterFood}</td>
                      <td>{takenToday ? 'Yes' : 'No'}</td>
                      <td className="caregiver-dashboard__table-actions">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleEditMedicine(med)}
                          className="caregiver-dashboard__btn-table-edit"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={() => handleDeleteMedicine(med._id)}
                          className="caregiver-dashboard__btn-table-delete"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Box>
          <RecoveryGraph data={recoveryData} />
          {/* Modals */}
          <Modal open={modalOpen} onClose={handleCloseModal}>
            <Box className="caregiver-dashboard__modal-container">
              <Typography variant="h6" gutterBottom className="caregiver-dashboard__modal-title">
                {editingMedicineId ? 'Edit Medicine' : 'Add Medicine'}
              </Typography>
              <TextField
                label="Medicine Name"
                name="name"
                value={newMedicine.name}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                size="small"
              />
              <TextField
                label="Dosage"
                name="dosage"
                value={newMedicine.dosage}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                size="small"
              />
              <TextField
                label="Times (comma-separated, e.g., 08:00, 14:00, 20:00)"
                name="times"
                value={newMedicine.times}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                placeholder="08:00, 14:00, 20:00"
                size="small"
              />
              <TextField
                label="Prescribed Days"
                name="prescribedDays"
                type="number"
                value={newMedicine.prescribedDays}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                size="small"
              />
              <TextField
                label="Doctor Contact"
                name="doctorContact"
                value={newMedicine.doctorContact}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                size="small"
              />
              <Box className="caregiver-dashboard__modal-actions">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveMedicine}
                  fullWidth
                  className="caregiver-dashboard__btn-modal-save"
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCloseModal}
                  fullWidth
                  className="caregiver-dashboard__btn-modal-cancel"
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </Modal>
          <Modal open={contactModalOpen} onClose={handleCloseContactModal}>
            <Box className="caregiver-dashboard__modal-container">
              <Typography variant="h6" gutterBottom className="caregiver-dashboard__modal-title">
                {editingContactId ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
              </Typography>
              <TextField
                label="Name"
                name="name"
                value={newContact.name}
                onChange={handleContactInputChange}
                fullWidth
                margin="normal"
                size="small"
              />
              <TextField
                label="Phone"
                name="phone"
                value={newContact.phone}
                onChange={handleContactInputChange}
                fullWidth
                margin="normal"
                size="small"
              />
              <TextField
                label="Email"
                name="email"
                value={newContact.email}
                onChange={handleContactInputChange}
                fullWidth
                margin="normal"
                size="small"
              />
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  name="role"
                  value={newContact.role}
                  label="Role"
                  onChange={handleContactInputChange}
                >
                  <MenuItem value="Private Ambulance">Ambulance</MenuItem>
                  <MenuItem value="Nurse or Caretaker">Caretaker</MenuItem>
                  <MenuItem value="Relative">Relative</MenuItem>
                </Select>
              </FormControl>
              <Box className="caregiver-dashboard__modal-actions">
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleSaveContact}
                  fullWidth
                  className="caregiver-dashboard__btn-modal-save"
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCloseContactModal}
                  fullWidth
                  className="caregiver-dashboard__btn-modal-cancel"
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </Modal>
        </Box>
      </Box>
    </>
  );
};

export default CaregiverDashboard;

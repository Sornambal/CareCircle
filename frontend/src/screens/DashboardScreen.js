import React, { useEffect, useState, useRef } from 'react';
import MedicineCard from '../components/MedicineCard';
import SOSButton from '../components/SOSButton';
import ReportCard from '../components/ReportCard';
import RecoveryGraph from '../components/RecoveryGraph';
import ProfileCard from '../components/ProfileCard';
import useMultilingualNotifications from '../hooks/useMultilingualNotifications';
import usePWAInstall from '../hooks/usePWAInstall';
import { fetchMedicines, addMedicine, getTodaysMedicines, markMedicineTaken, updateMedicine, deleteMedicine, getEmergencyContacts, addEmergencyContact, updateEmergencyContact, deleteEmergencyContact } from '../utils/api';
import { Box, Typography, CircularProgress, Alert, Grid, Button, Modal, TextField, MenuItem, FormControl, InputLabel, Select, AppBar, Toolbar, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Card, CardContent, Avatar, IconButton } from '@mui/material';
import { Medication, AccessTime, Person, LocalHospital, Favorite, VolumeUp, GetApp } from '@mui/icons-material';
import { getTranslation } from '../utils/translations';
import './DashboardScreen.css';

const DashboardScreen = () => {
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

  const language = user?.preferredLanguage || 'English';

  const handleLanguageChange = (newLang) => {
    const updatedUser = { ...(user || {}), preferredLanguage: newLang };
    setUser(updatedUser);
    try {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (e) {
      console.warn('Failed to persist user language preference', e);
    }
  };

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

  const triggeredDialogs = useRef(new Set());

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      todaysMedicines.forEach(medicine => {
        if (medicine.scheduledTimes && Array.isArray(medicine.scheduledTimes)) {
          medicine.scheduledTimes.forEach(scheduled => {
            if (scheduled.status === 'pending') {
              const [hour, minute] = scheduled.time.split(':').map(Number);
              if (currentHour === hour && currentMinute === minute) {
                const dialogKey = `${medicine._id}-${scheduled.time}`;
                if (!triggeredDialogs.current.has(dialogKey)) {
                  setReminderDialog({ open: true, medicine, scheduledTime: scheduled.time });
                  triggeredDialogs.current.add(dialogKey);
                }
              }
            }
          });
        }
      });
    };

    const reminderInterval = setInterval(checkReminders, 60000);
    checkReminders();

    return () => clearInterval(reminderInterval);
  }, [todaysMedicines]);

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

  const isElderly = user.role === 'elderly';
  const isCaregiver = user.role === 'caregiver';

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

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/reports/generate-pdf?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF report');
      }

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
      <Box className="dashboard-container">
        <Box className="dashboard-content">
          {/* Header Section */}
          <AppBar position="static" elevation={0} className="dashboard-header">
            <Toolbar className="header-toolbar">
              <Box className="header-logo">
                <Favorite className="logo-icon" />
                <Box className="logo-text">
                  <Typography variant="h5" component="div" className="logo-title">
                    {getTranslation(language, 'careCircle')}
                  </Typography>
                  <Typography variant="body2" className="logo-subtitle">
                    {getTranslation(language, 'yourHealthCompanion')}
                  </Typography>
                </Box>
              </Box>
              
              <Box className="header-controls">
                <Select
                  value={language}
                  size="small"
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="language-select"
                >
                  <MenuItem value="English">English</MenuItem>
                  <MenuItem value="Tamil">தமிழ் (Tamil)</MenuItem>
                  <MenuItem value="Hindi">हिन्दी (Hindi)</MenuItem>
                  <MenuItem value="Malayalam">മലയാളം (Malayalam)</MenuItem>
                </Select>

                <IconButton
                  className="voice-test-btn"
                  title="List voices & play test"
                  onClick={() => {
                    if (typeof testVoiceSupport === 'function') testVoiceSupport();
                    const sampleMed = { name: 'Paracetamol', dosage: '1 tablet' };
                    if (typeof triggerDemoNotification === 'function') triggerDemoNotification(sampleMed);
                  }}
                >
                  <VolumeUp />
                </IconButton>
              </Box>

              {isElderly && (
                <Box className="sos-section">
                  <Typography variant="body2" className="sos-text">
                    {getTranslation(language, 'needHelpText')}
                  </Typography>
                  <Box className="sos-buttons">
                    <SOSButton type="all" user={user} />
                    <SOSButton type="relatives" user={user} />
                  </Box>
                </Box>
              )}
            </Toolbar>
          </AppBar>

          {/* Welcome Section for Elderly */}
          {isElderly && (
            <Card className="welcome-card">
              <CardContent className="welcome-content">
                <Avatar className="welcome-avatar">👋</Avatar>
                <Typography variant="h4" gutterBottom className="welcome-title">
                  {getTranslation(language, 'hello')} {user?.elderlyName || getTranslation(language, 'friend')}!
                </Typography>
                <Typography variant="h6" className="welcome-subtitle">
                  {getTranslation(language, 'howFeeling')}
                </Typography>
                <Box className="feeling-chips">
                  <Chip label={getTranslation(language, 'great')} variant="outlined" className="feeling-chip" />
                  <Chip label={getTranslation(language, 'okay')} variant="outlined" className="feeling-chip" />
                  <Chip label={getTranslation(language, 'needHelp')} variant="outlined" className="feeling-chip" />
                </Box>
              </CardContent>
            </Card>
          )}

          {isCaregiver && <ProfileCard user={user} />}

          {/* Caregiver Quick Actions */}
          {isCaregiver && (
            <Card className="quick-actions-card">
              <CardContent className="quick-actions-content">
                <Typography variant="h6" gutterBottom className="quick-actions-title">
                  <Person className="section-icon" />
                  {getTranslation(language, 'quickActions')}
                </Typography>
                <Box className="quick-actions-buttons">
                  <Button
                    variant="contained"
                    startIcon={<Medication />}
                    onClick={handleOpenModal}
                    className="add-medicine-btn"
                    fullWidth
                  >
                    {getTranslation(language, 'addMedicine')}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<LocalHospital />}
                    onClick={() => setContactModalOpen(true)}
                    className="add-contact-btn"
                    fullWidth
                  >
                    {getTranslation(language, 'addEmergencyContact')}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Loading and Error States */}
          {loading && (
            <Card className="loading-card">
              <CircularProgress className="loading-spinner" />
              <Typography className="loading-text">
                {getTranslation(language, 'loadingHealth')}
              </Typography>
            </Card>
          )}
          {error && (
            <Alert severity="error" className="error-alert">
              {error}
            </Alert>
          )}

          {/* Current Time Display */}
          <Card className="time-card">
            <CardContent className="time-content">
              <AccessTime className="time-icon" />
              <Typography variant="h3" className="time-display">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
              <Typography variant="h6" className="date-display">
                {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
            </CardContent>
          </Card>

          {/* Today's Medications Section */}
          <Card className="medications-card">
            <CardContent className="medications-content">
              <Typography variant="h5" gutterBottom className="medications-title">
                <Medication className="section-icon" />
                {getTranslation(language, 'todaysMedications')}
              </Typography>

              {todaysMedicines.length > 0 ? (
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  {todaysMedicines.map((med) => (
                    <Grid item xs={12} sm={6} md={4} key={med._id}>
                      <Card variant="outlined" className="medicine-item-card">
                        <CardContent className="medicine-item-content">
                          <MedicineCard medicine={med} onMarkTaken={handleTakeMedicine} />
                          <Box className="medicine-actions">
                            {isElderly && (
                              <Button
                                variant="contained"
                                color="success"
                                size="large"
                                onClick={() => handleTakeMedicine(med._id, med.scheduledTimes[0]?.time)}
                                className="taken-btn"
                              >
                                ✅ {getTranslation(language, 'takenIt')}
                              </Button>
                            )}
                            {isCaregiver && (
                              <Box className="medicine-edit-actions">
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleEditMedicine(med)}
                                  className="edit-btn"
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteMedicine(med._id)}
                                  className="delete-btn"
                                >
                                  Delete
                                </Button>
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box className="no-medications">
                  <Typography variant="h6" className="no-medications-title">
                    🎉 {getTranslation(language, 'noMedications')}
                  </Typography>
                  <Typography variant="body1" className="no-medications-text">
                    {getTranslation(language, 'enjoyDay')}
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
            className="reminder-dialog"
          >
            <DialogTitle className="reminder-dialog-title">
              {getTranslation(language, 'medicationReminder')}
            </DialogTitle>
            <DialogContent>
              <Typography variant="h6" className="reminder-medicine-name">
                {getTranslation(language, 'timeToTake')} {reminderDialog.medicine?.name}
              </Typography>
              <Typography variant="body1" className="reminder-dosage">
                {getTranslation(language, 'dosage')} {reminderDialog.medicine?.dosage}
              </Typography>
              <Typography variant="body2" color="textSecondary" className="reminder-time">
                {getTranslation(language, 'scheduledTime')} {reminderDialog.scheduledTime}
              </Typography>
              <Button
                onClick={() => triggerDemoNotification(reminderDialog.medicine)}
                variant="outlined"
                color="secondary"
                fullWidth
                className="test-notification-btn"
              >
                {getTranslation(language, 'testNotification')} ({user?.preferredLanguage || 'English'})
              </Button>
            </DialogContent>
            <DialogActions className="reminder-actions">
              <Button
                onClick={() => handleTakeMedicine(reminderDialog.medicine?._id, reminderDialog.scheduledTime)}
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                className="reminder-taken-btn"
              >
                {getTranslation(language, 'takenIt')}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Caregiver Sections */}
          {isCaregiver && (
            <>
              <Typography variant="h6" gutterBottom className="section-heading">
                {getTranslation(language, 'emergencyContacts')}
              </Typography>
              <Button 
                variant="contained" 
                color="secondary" 
                onClick={() => setContactModalOpen(true)} 
                fullWidth
                className="add-contact-main-btn"
              >
                + {getTranslation(language, 'addEmergencyContact')}
              </Button>
              <Grid container spacing={{ xs: 2, sm: 2 }} className="contacts-grid">
                {emergencyContacts.map((contact) => (
                  <Grid item xs={12} sm={6} md={4} key={contact._id}>
                    <Box className="contact-card">
                      <Typography variant="h6" className="contact-name">
                        {contact.name}
                      </Typography>
                      <Typography className="contact-info">Phone: {contact.phone}</Typography>
                      <Typography className="contact-info">Email: {contact.email}</Typography>
                      <Typography className="contact-info">Role: {contact.role}</Typography>
                      <Box className="contact-actions">
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={() => handleEditContact(contact)}
                          fullWidth
                          className="contact-edit-btn"
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          color="error" 
                          onClick={() => handleDeleteContact(contact._id)}
                          fullWidth
                          className="contact-delete-btn"
                        >
                          Delete
                        </Button>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Typography variant="h6" gutterBottom className="section-heading">
                {getTranslation(language, 'reportTracking')}
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleDownloadReport}
                fullWidth
                className="download-report-btn"
              >
                {getTranslation(language, 'downloadReport')}
              </Button>
              <ReportCard adherence={calculateAdherence()} />

              {/* Medicine Taken Report Table */}
              <Box className="report-table-container">
                <table className="report-table">
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
                      const beforeAfterFood = med.time && med.time.includes('Before Food') ? 'Before Food' : med.time && med.time.includes('After Food') ? 'After Food' : '';

                      return (
                        <tr key={med._id}>
                          <td>{med.name}</td>
                          <td>{beforeAfterFood}</td>
                          <td>{takenToday ? 'Yes' : 'No'}</td>
                          <td className="table-actions">
                            <Button 
                              variant="outlined" 
                              size="small" 
                              onClick={() => handleEditMedicine(med)}
                              className="table-edit-btn"
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="outlined" 
                              size="small" 
                              color="error" 
                              onClick={() => handleDeleteMedicine(med._id)}
                              className="table-delete-btn"
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
            </>
          )}

          {/* Modals */}
          {isCaregiver && (
            <>
              <Modal open={modalOpen} onClose={handleCloseModal}>
                <Box className="modal-box">
                  <Typography variant="h6" gutterBottom className="modal-title">
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
                  <Box className="modal-actions">
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={handleSaveMedicine}
                      fullWidth
                      className="modal-save-btn"
                    >
                      Save
                    </Button>
                    <Button 
                      variant="outlined" 
                      onClick={handleCloseModal}
                      fullWidth
                      className="modal-cancel-btn"
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              </Modal>

              <Modal open={contactModalOpen} onClose={handleCloseContactModal}>
                <Box className="modal-box">
                  <Typography variant="h6" gutterBottom className="modal-title">
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
                  <Box className="modal-actions">
                    <Button 
                      variant="contained" 
                      color="secondary" 
                      onClick={handleSaveContact}
                      fullWidth
                      className="modal-save-btn"
                    >
                      Save
                    </Button>
                    <Button 
                      variant="outlined" 
                      onClick={handleCloseContactModal}
                      fullWidth
                      className="modal-cancel-btn"
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              </Modal>
            </>
          )}
        </Box>
      </Box>
    </>
  );
};

export default DashboardScreen;

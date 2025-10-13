import React, { useEffect, useState, useRef } from 'react';
import MedicineCard from '../components/MedicineCard';
import SOSButton from '../components/SOSButton';
import ReportCard from '../components/ReportCard';
import RecoveryGraph from '../components/RecoveryGraph';
import ProfileCard from '../components/ProfileCard';
import useMultilingualNotifications from '../hooks/useMultilingualNotifications';
import { fetchMedicines, addMedicine, getTodaysMedicines, markMedicineTaken, updateMedicine, deleteMedicine, getEmergencyContacts, addEmergencyContact, updateEmergencyContact, deleteEmergencyContact } from '../utils/api';
import { Box, Typography, CircularProgress, Alert, Grid, Button, Modal, TextField, MenuItem, FormControl, InputLabel, Select, AppBar, Toolbar, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Card, CardContent, Avatar } from '@mui/material';
import { Medication, AccessTime, Person, Phone, Email, LocalHospital, FamilyRestroom, Favorite } from '@mui/icons-material';

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

  const token = localStorage.getItem('token');
  const [user, setUser] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  });

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

    // Request notification permission on load
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
        // Refresh today's medicines
        const response = await getTodaysMedicines(token);
        setTodaysMedicines(response.data || []);
      }
      setReminderDialog({ open: false, medicine: null, scheduledTime: null });
    } catch (error) {
      console.error('Error marking medicine as taken:', error);
    }
  };

  // Use the multilingual notifications hook
  const { triggerDemoNotification } = useMultilingualNotifications(todaysMedicines, user, token, handleTakeMedicine);

  // Track triggered dialogs to prevent repeats
  const triggeredDialogs = useRef(new Set());

  // Check for medication reminders every minute
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
                  // Show dialog as fallback or additional UI
                  setReminderDialog({ open: true, medicine, scheduledTime: scheduled.time });
                  // Mark as triggered to prevent repeats
                  triggeredDialogs.current.add(dialogKey);
                }
              }
            }
          });
        }
      });
    };

    const reminderInterval = setInterval(checkReminders, 60000); // Check every minute
    checkReminders(); // Check immediately

    return () => clearInterval(reminderInterval);
  }, [todaysMedicines]);

  // Calculate adherence percentage (mocked for demo)
  const calculateAdherence = () => {
    if (medicines.length === 0) return 0;
    // For demo, assume 80% adherence
    return 80;
  };

  // Prepare recovery data for graph (mocked for demo)
  const recoveryData = [
    { date: 'Day 1', recovery: 20 },
    { date: 'Day 3', recovery: 40 },
    { date: 'Day 5', recovery: 60 },
    { date: 'Day 7', recovery: 80 },
    { date: 'Day 10', recovery: 90 },
    { date: 'Day 14', recovery: 100 },
  ];



  const handleOpenModal = () => {
    setModalOpen(true);
  };

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
        dosage: String(newMedicine.dosage),  // Convert dosage to string to match backend schema
        times: newMedicine.times.split(',').map(time => time.trim()), // Split times into array
        prescribedDays: parseInt(newMedicine.prescribedDays, 10),
        doctorContact: newMedicine.doctorContact,
      };
      if (editingMedicineId) {
        await updateMedicine(editingMedicineId, medicineData, token);
      } else {
        await addMedicine(medicineData, token);
      }
      handleCloseModal();
      // Reload medicines
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
      // Reload contacts
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

  // New handlers for editing and deleting medicines
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
    console.log('Deleting medicine with id:', id);
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

  // New handlers for editing and deleting emergency contacts
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
    console.log('Deleting contact with id:', id);
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await deleteEmergencyContact(id, token);
        // Reload contacts
        const contacts = await getEmergencyContacts(token);
        setEmergencyContacts(contacts.data || []);
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete contact');
      }
    }
  };

  // Load emergency contacts on mount
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const contacts = await getEmergencyContacts(token);
        console.log('Emergency contacts loaded:', contacts.data);
        setEmergencyContacts(contacts.data || []);
      } catch (error) {
        console.error('Failed to load emergency contacts', error);
      }
    };
    if (token) {
      loadContacts();
    }
  }, [token]);

  // Download PDF report handler
  const handleDownloadReport = async () => {
    try {
      // Calculate date range (last 30 days by default)
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
      <Box sx={{
        minHeight: '100vh',
        background: '#F7F9FA',
        py: 4
      }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3 }}>

          {/* Header Section */}
          <AppBar position="static" elevation={0} sx={{
            mb: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            color: 'text.primary'
          }}>
            <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Favorite sx={{ color: '#ff6b6b', fontSize: 32 }} />
                <Box>
                  <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    CareCircle
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Your Health Companion
                  </Typography>
                </Box>
              </Box>
              {isElderly && (
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mr: 1 }}>
                    Need Help?
                  </Typography>
                  <SOSButton type="all" user={user} />
                  <SOSButton type="relatives" user={user} />
                </Box>
              )}
            </Toolbar>
          </AppBar>

          {/* Welcome Section for Elderly */}
          {isElderly && (
            <Card sx={{
              mb: 4,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              border: '2px solid #e3f2fd'
            }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Avatar sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: '#4caf50',
                  fontSize: 36
                }}>
                  👋
                </Avatar>
                <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
                  Hello {user?.elderlyName || 'Friend'}!
                </Typography>
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
                  How are you feeling today?
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label="😊 Great" variant="outlined" sx={{ borderRadius: 2 }} />
                  <Chip label="😐 Okay" variant="outlined" sx={{ borderRadius: 2 }} />
                  <Chip label="😟 Need Help" variant="outlined" sx={{ borderRadius: 2 }} />
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Caregiver Profile */}
          {isCaregiver && <ProfileCard user={user} />}

          {/* Caregiver Quick Actions */}
          {isCaregiver && (
            <Card sx={{
              mb: 4,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person sx={{ color: '#2196f3' }} />
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<Medication />}
                    onClick={handleOpenModal}
                    sx={{
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)',
                      boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                    }}
                  >
                    Add Medicine
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<LocalHospital />}
                    onClick={() => setContactModalOpen(true)}
                    sx={{ borderRadius: 2 }}
                  >
                    Add Emergency Contact
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Loading and Error States */}
          {loading && (
            <Card sx={{
              mb: 4,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              textAlign: 'center',
              py: 4
            }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Loading your health information...</Typography>
            </Card>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Current Time Display */}
          <Card sx={{
            mb: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            textAlign: 'center'
          }}>
            <CardContent sx={{ py: 3 }}>
              <AccessTime sx={{ fontSize: 48, color: '#ff9800', mb: 1 }} />
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1 }}>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
              <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
            </CardContent>
          </Card>

          {/* Today's Medications Section */}
          <Card sx={{
            mb: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3
          }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: '#2c3e50',
                fontWeight: 'bold'
              }}>
                <Medication sx={{ color: '#4caf50' }} />
                Today's Medications
              </Typography>

              {todaysMedicines.length > 0 ? (
                <Grid container spacing={3}>
                  {todaysMedicines.map((med) => (
                    <Grid item xs={12} sm={6} md={4} key={med._id}>
                      <Card variant="outlined" sx={{
                        borderRadius: 2,
                        border: '2px solid #e8f5e8',
                        background: 'linear-gradient(135deg, #f1f8e9 0%, #ffffff 100%)'
                      }}>
                        <CardContent>
                          <MedicineCard medicine={med} onMarkTaken={handleTakeMedicine} />
                          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexDirection: 'column' }}>
                            {isElderly && (
                              <Button
                                variant="contained"
                                color="success"
                                size="large"
                                onClick={() => handleTakeMedicine(med._id, med.scheduledTimes[0]?.time)}
                                sx={{
                                  borderRadius: 2,
                                  fontSize: '1.1rem',
                                  fontWeight: 'bold',
                                  py: 1.5
                                }}
                              >
                                ✅ I have taken it
                              </Button>
                            )}
                            {isCaregiver && (
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleEditMedicine(med)}
                                  sx={{ borderRadius: 2, flex: 1 }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteMedicine(med._id)}
                                  sx={{ borderRadius: 2, flex: 1 }}
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
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
                    🎉 No medications scheduled for today!
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    Take it easy and enjoy your day.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Medication Reminder Dialog */}
          <Dialog open={reminderDialog.open} onClose={() => setReminderDialog({ open: false, medicine: null, scheduledTime: null })}>
            <DialogTitle>Medication Reminder</DialogTitle>
            <DialogContent>
              <Typography variant="h6">
                Time to take: {reminderDialog.medicine?.name}
              </Typography>
              <Typography variant="body1">
                Dosage: {reminderDialog.medicine?.dosage}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Scheduled time: {reminderDialog.scheduledTime}
              </Typography>
              <Button
                onClick={() => triggerDemoNotification(reminderDialog.medicine)}
                variant="outlined"
                color="secondary"
                sx={{ mt: 2 }}
              >
                Test Notification ({user?.preferredLanguage || 'English'})
              </Button>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => handleTakeMedicine(reminderDialog.medicine?._id, reminderDialog.scheduledTime)}
                variant="contained"
                color="primary"
                size="large"
                sx={{ fontSize: '1.2rem', padding: '12px 24px' }}
              >
                I have taken it
              </Button>
            </DialogActions>
          </Dialog>

          {isCaregiver && (
            <>
              <Typography variant="h6" gutterBottom>
                Emergency Contacts
              </Typography>
              <Button variant="contained" color="secondary" onClick={() => setContactModalOpen(true)} sx={{ mb: 2 }}>
                + Add Emergency Contact
              </Button>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {emergencyContacts.map((contact) => (
                  <Grid item xs={12} sm={6} md={4} key={contact._id}>
                    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 2 }}>
                      <Typography variant="h6">{contact.name}</Typography>
                      <Typography>Phone: {contact.phone}</Typography>
                      <Typography>Email: {contact.email}</Typography>
                      <Typography>Role: {contact.role}</Typography>
                      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                        <Button variant="outlined" size="small" onClick={() => handleEditContact(contact)}>Edit</Button>
                        <Button variant="outlined" size="small" color="error" onClick={() => handleDeleteContact(contact._id)}>Delete</Button>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Typography variant="h6" gutterBottom>
                Report & Tracking
              </Typography>
              <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={handleDownloadReport}>
                Download Report
              </Button>
              <ReportCard adherence={calculateAdherence()} />

              {/* Medicine Taken Report Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Medicine Name</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Before/After Food</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Taken Today</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((med) => {
                    // Determine if medicine taken today
                    const today = new Date().toISOString().slice(0, 10);
                    const takenToday = med.taken.some(t => t.date && t.date.slice(0, 10) === today);
                    const beforeAfterFood = med.time && med.time.includes('Before Food') ? 'Before Food' : med.time && med.time.includes('After Food') ? 'After Food' : '';

                    return (
                      <tr key={med._id}>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{med.name}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{beforeAfterFood}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{takenToday ? 'Yes' : 'No'}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                          <Button variant="outlined" size="small" onClick={() => handleEditMedicine(med)}>Edit</Button>
                          <Button variant="outlined" size="small" color="error" onClick={() => handleDeleteMedicine(med._id)}>Delete</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <RecoveryGraph data={recoveryData} />

              {/* TODO: Add Daily Medicine Tracker with toggle for Taken/Missed */}

              {/* TODO: Add Notifications Section */}

              {/* TODO: Add Companionship Chatbot Section */}

              {/* TODO: Add Helper / Family Connectivity Section */}

              {/* TODO: Add Footer Navigation */}
            </>
          )}

          {isCaregiver && (
            <>
              <Modal open={modalOpen} onClose={handleCloseModal}>
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 400,
                  bgcolor: 'background.paper',
                  boxShadow: 24,
                  p: 4,
                  borderRadius: 2,
                }}>
                  <Typography variant="h6" gutterBottom>
                    {editingMedicineId ? 'Edit Medicine' : 'Add Medicine'}
                  </Typography>
                  <TextField
                    label="Medicine Name"
                    name="name"
                    value={newMedicine.name}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Dosage"
                    name="dosage"
                    value={newMedicine.dosage}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Times (comma-separated, e.g., 08:00, 14:00, 20:00)"
                    name="times"
                    value={newMedicine.times}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    placeholder="08:00, 14:00, 20:00"
                  />
                  <TextField
                    label="Prescribed Days"
                    name="prescribedDays"
                    type="number"
                    value={newMedicine.prescribedDays}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Doctor Contact"
                    name="doctorContact"
                    value={newMedicine.doctorContact}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Button variant="contained" color="primary" onClick={handleSaveMedicine}>
                      Save
                    </Button>
                    <Button variant="outlined" onClick={handleCloseModal}>
                      Cancel
                    </Button>
                  </Box>
                </Box>
              </Modal>

              <Modal open={contactModalOpen} onClose={handleCloseContactModal}>
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 400,
                  bgcolor: 'background.paper',
                  boxShadow: 24,
                  p: 4,
                  borderRadius: 2,
                }}>
                  <Typography variant="h6" gutterBottom>
                    {editingContactId ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                  </Typography>
                  <TextField
                    label="Name"
                    name="name"
                    value={newContact.name}
                    onChange={handleContactInputChange}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Phone"
                    name="phone"
                    value={newContact.phone}
                    onChange={handleContactInputChange}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Email"
                    name="email"
                    value={newContact.email}
                    onChange={handleContactInputChange}
                    fullWidth
                    margin="normal"
                  />
                  <FormControl fullWidth margin="normal">
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
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Button variant="contained" color="secondary" onClick={handleSaveContact}>
                      Save
                    </Button>
                    <Button variant="outlined" onClick={handleCloseContactModal}>
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


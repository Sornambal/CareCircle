 import React, { useEffect, useState } from 'react';
import MedicineCard from '../components/MedicineCard';
import SOSButton from '../components/SOSButton';
import ReportCard from '../components/ReportCard';
import RecoveryGraph from '../components/RecoveryGraph';
import ProfileCard from '../components/ProfileCard';
import { fetchMedicines, sendSOSAlert, addMedicine } from '../utils/api';
import { Box, Typography, CircularProgress, Alert, Grid, Button, Modal, TextField, MenuItem, FormControl, InputLabel, Select, AppBar, Toolbar } from '@mui/material';

const DashboardScreen = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    dosage: '',
    timeOfDay: '',
    beforeAfterFood: '',
    prescribedDays: '',
    doctorContact: '',
  });
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
    role: '',
  });
  const [emergencyContacts, setEmergencyContacts] = useState([]);
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
  }, [token]);  // Removed user from dependency array to prevent re-renders

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

  const handleSOS = async () => {
    if (!user || !token) return;
    // For demo, location is mocked
    const location = { lat: 0, lng: 0 };
    try {
      await sendSOSAlert(user._id, location, token, 'emergency'); // Main SOS - sends to all (ambulance, caretaker, relative)
      alert('Emergency SOS alert sent to all contacts!');
    } catch (err) {
      alert('Failed to send SOS alert');
    }
  };

  const handleSOSFamily = async () => {
    if (!user || !token) return;
    // For demo, location is mocked
    const location = { lat: 0, lng: 0 };
    try {
      await sendSOSAlert(user._id, location, token, 'family'); // Family SOS - sends to caretaker and relative only
      alert('SOS alert sent to family contacts!');
    } catch (err) {
      alert('Failed to send SOS alert');
    }
  };

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setNewMedicine({
      name: '',
      dosage: '',
      timeOfDay: '',
      beforeAfterFood: '',
      prescribedDays: '',
      doctorContact: '',
    });
  };

  const handleInputChange = (e) => {
    setNewMedicine({ ...newMedicine, [e.target.name]: e.target.value });
  };

  const handleAddMedicine = async () => {
    if (!newMedicine.name || !newMedicine.dosage || !newMedicine.timeOfDay || !newMedicine.beforeAfterFood || !newMedicine.prescribedDays) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const medicineData = {
        name: newMedicine.name,
        dosage: String(newMedicine.dosage),  // Convert dosage to string to match backend schema
        time: `${newMedicine.timeOfDay} ${newMedicine.beforeAfterFood}`,
        prescribedDays: parseInt(newMedicine.prescribedDays, 10),
        doctorContact: newMedicine.doctorContact,
      };
      await addMedicine(medicineData, token);
      handleCloseModal();
      // Reload medicines
      const response = await fetchMedicines(token);
      setMedicines(response.data || []);
    } catch (err) {
      console.error('Add medicine error:', err);
      const message = err.response?.data?.message || 'Failed to add medicine';
      alert(message);
    }
  };

  const handleContactInputChange = (e) => {
    setNewContact({ ...newContact, [e.target.name]: e.target.value });
  };

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone || !newContact.role) {
      alert('Please fill name, phone, and role');
      return;
    }
    setEmergencyContacts([...emergencyContacts, newContact]);
    setContactModalOpen(false);
    setNewContact({ name: '', phone: '', email: '', role: '' });
  };



  const handleMarkTaken = (medicineId) => {
    // Mock: Update local state
    setMedicines(medicines.map(med =>
      med._id === medicineId
        ? { ...med, taken: [...med.taken, { date: new Date().toISOString() }] }
        : med
    ));
    alert('Marked as taken');
  };

  const handleMarkNotTaken = (medicineId) => {
    // Mock: Update local state
    setMedicines(medicines.map(med =>
      med._id === medicineId
        ? { ...med, taken: med.taken.filter(t => t.date.slice(0, 10) !== new Date().toISOString().slice(0, 10)) }
        : med
    ));
    alert('Marked as not taken');
  };

  const handleDownloadReport = () => {
    // Mock: Download report
    alert('Report downloaded');
  };
  const handleCloseContactModal = () => {
    setContactModalOpen(false);
    setNewContact({ name: '', phone: '', email: '', role: '' });
  };

  const isElderly = user.role === 'elderly';
  const isCaregiver = user.role === 'caregiver';

  return (
    <>
      <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
        <AppBar position="static" color="primary" sx={{ mb: 3 }}>
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div">
              CareCircle
            </Typography>
            {isElderly && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" color="error" onClick={handleSOS}>
                  EMERGENCY SOS
                </Button>
                <Button variant="contained" color="warning" onClick={handleSOSFamily}>
                  FAMILY SOS
                </Button>
              </Box>
            )}
          </Toolbar>
        </AppBar>

        {isCaregiver && <ProfileCard user={user} />}

        {isCaregiver && (
          <Button variant="contained" color="primary" onClick={handleOpenModal} sx={{ mb: 2 }}>
            + Add Medicine
          </Button>
        )}

        {loading && <CircularProgress sx={{ display: 'block', mx: 'auto' }} />}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {!loading && medicines.length === 0 && <Typography>No medicines found.</Typography>}

        <Typography variant="h6" gutterBottom>
          Medicine Reminders
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {medicines.map((med) => (
            <Grid item xs={12} sm={6} md={4} key={med._id}>
              <MedicineCard medicine={med} />
              {isElderly && (
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                  <Button variant="contained" color="success" size="small">
                    Taken
                  </Button>
                  <Button variant="outlined" color="error" size="small">
                    Not Taken
                  </Button>
                </Box>
              )}
            </Grid>
          ))}
        </Grid>

        {isCaregiver && (
          <>
            <Typography variant="h6" gutterBottom>
              Emergency Contacts
            </Typography>
            <Button variant="contained" color="secondary" onClick={() => setContactModalOpen(true)} sx={{ mb: 2 }}>
              + Add Emergency Contact
            </Button>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {emergencyContacts.map((contact, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 2 }}>
                    <Typography variant="h6">{contact.name}</Typography>
                    <Typography>Phone: {contact.phone}</Typography>
                    <Typography>Email: {contact.email}</Typography>
                    <Typography>Role: {contact.role}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Typography variant="h6" gutterBottom>
              Report & Tracking
            </Typography>
            <Button variant="contained" color="primary" sx={{ mb: 2 }}>
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
                  Add Medicine
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
                <FormControl fullWidth margin="normal">
                  <InputLabel id="timeOfDay-label">Time of Day</InputLabel>
                  <Select
                    labelId="timeOfDay-label"
                    name="timeOfDay"
                    value={newMedicine.timeOfDay}
                    label="Time of Day"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="Morning">Morning</MenuItem>
                    <MenuItem value="Afternoon">Afternoon</MenuItem>
                    <MenuItem value="Night">Night</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="beforeAfterFood-label">Before/After Food</InputLabel>
                  <Select
                    labelId="beforeAfterFood-label"
                    name="beforeAfterFood"
                    value={newMedicine.beforeAfterFood}
                    label="Before/After Food"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="Before Food">Before Food</MenuItem>
                    <MenuItem value="After Food">After Food</MenuItem>
                  </Select>
                </FormControl>
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
                  <Button variant="contained" color="primary" onClick={handleAddMedicine}>
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
                  Add Emergency Contact
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
                    <MenuItem value="ambulance">Ambulance</MenuItem>
                    <MenuItem value="relative">Relative</MenuItem>
                    <MenuItem value="caretaker">Caretaker</MenuItem>
                  </Select>
                </FormControl>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Button variant="contained" color="secondary" onClick={handleAddContact}>
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
    </>
  );
};

export default DashboardScreen;

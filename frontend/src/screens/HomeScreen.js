import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import SOSButton from '../components/SOSButton';
import { fetchMedicines } from '../utils/api';

const HomeScreen = () => {
  const [medicines, setMedicines] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reminderDialog, setReminderDialog] = useState({ open: false, medicine: null });

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const response = await fetchMedicines();
        setMedicines(response.data || []);
      } catch (error) {
        console.error('Error fetching medicines:', error);
      }
    };

    fetchHomeData();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check for medication reminders every minute
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      medicines.forEach(medicine => {
        if (medicine.times && Array.isArray(medicine.times)) {
          medicine.times.forEach(time => {
            const [hour, minute] = time.split(':').map(Number);
            if (currentHour === hour && currentMinute === minute) {
              setReminderDialog({ open: true, medicine });
            }
          });
        }
      });
    };

    const reminderInterval = setInterval(checkReminders, 60000); // Check every minute
    checkReminders(); // Check immediately

    return () => clearInterval(reminderInterval);
  }, [medicines]);

  const handleTakeMedicine = () => {
    // TODO: Implement medicine taken logging
    setReminderDialog({ open: false, medicine: null });
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Welcome to CareCircle
      </Typography>
      <Typography variant="h6" align="center" sx={{ mb: 4 }}>
        {currentTime.toLocaleTimeString()}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Medications
              </Typography>
              {medicines.length > 0 ? (
                medicines.map((med, index) => (
                  <Typography key={index} variant="body1">
                    {med.name} - {med.dosage} at {med.times ? med.times.join(', ') : 'No times set'}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No medications scheduled for today.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Emergency SOS
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <SOSButton type="all" />
                <SOSButton type="relatives" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Medication Reminder Dialog */}
      <Dialog open={reminderDialog.open} onClose={() => setReminderDialog({ open: false, medicine: null })}>
        <DialogTitle>Medication Reminder</DialogTitle>
        <DialogContent>
          <Typography variant="h6">
            Time to take: {reminderDialog.medicine?.name}
          </Typography>
          <Typography variant="body1">
            Dosage: {reminderDialog.medicine?.dosage}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTakeMedicine} variant="contained" color="primary">
            I have taken it
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HomeScreen;

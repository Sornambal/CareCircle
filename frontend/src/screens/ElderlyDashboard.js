import React, { useEffect, useState, useRef } from 'react';
import MedicineCard from '../components/MedicineCard';
import SOSButton from '../components/SOSButton';
import useMultilingualNotifications from '../hooks/useMultilingualNotifications';
import usePWAInstall from '../hooks/usePWAInstall';
import { getTodaysMedicines, markMedicineTaken } from '../utils/api';
import { Box, Typography, CircularProgress, Alert, Grid, Button, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Card, CardContent, Avatar, IconButton, AppBar, Toolbar, Select, MenuItem } from '@mui/material';
import { Medication, AccessTime, Favorite, VolumeUp } from '@mui/icons-material';
import { t, setLanguage } from '../utils/i18n';
import './DashboardScreen.css';

const ElderlyDashboard = () => {
  const [todaysMedicines, setTodaysMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
    setLanguage(language); // Set language for polyglot
  }, [language]);

  useEffect(() => {
    const fetchTodaysMedicines = async () => {
      setLoading(true);
      setError('');
      try {
        if (token) {
          const response = await getTodaysMedicines(token);
          setTodaysMedicines(response.data || []);
        }
      } catch (error) {
        setError('Failed to load medicines');
      }
      setLoading(false);
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
                    {t('careCircle')}
                  </Typography>
                  <Typography variant="body2" className="logo-subtitle">
                    {t('yourHealthCompanion')}
                  </Typography>
                </Box>
              </Box>



              <Box className="sos-section">
                <Typography variant="body2" className="sos-text">
                  {t('needHelpText')}
                </Typography>
                <Box className="sos-buttons">
                  <SOSButton type="all" user={user} />
                  <SOSButton type="relatives" user={user} />
                </Box>
              </Box>
            </Toolbar>
          </AppBar>

          {/* Welcome Section for Elderly */}
          <Card className="welcome-card">
            <CardContent className="welcome-content">
              <Avatar className="welcome-avatar">👋</Avatar>
              <Typography variant="h4" gutterBottom className="welcome-title">
                {t('hello')} {user?.elderlyName || t('friend')}!
              </Typography>
              <Typography variant="h6" className="welcome-subtitle">
                {t('howFeeling')}
              </Typography>
              <Box className="feeling-chips">
                <Chip label={t('great')} variant="outlined" className="feeling-chip" />
                <Chip label={t('okay')} variant="outlined" className="feeling-chip" />
                <Chip label={t('needHelp')} variant="outlined" className="feeling-chip" />
              </Box>
            </CardContent>
          </Card>

          {/* Loading and Error States */}
          {loading && (
            <Card className="loading-card">
              <CircularProgress className="loading-spinner" />
              <Typography className="loading-text">
                {t('loadingHealth')}
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
                {t('todaysMedications')}
              </Typography>

              {todaysMedicines.length > 0 ? (
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  {todaysMedicines.map((med) => (
                    <Grid item xs={12} sm={6} md={4} key={med._id}>
                      <Card variant="outlined" className="medicine-item-card">
                        <CardContent className="medicine-item-content">
                          <MedicineCard medicine={med} onMarkTaken={handleTakeMedicine} />
                          <Box className="medicine-actions">
                            <Button
                              variant="contained"
                              color="success"
                              size="large"
                              onClick={() => handleTakeMedicine(med._id, med.scheduledTimes[0]?.time)}
                              className="taken-btn"
                            >
                              ✅ {t('takenIt')}
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box className="no-medications">
                  <Typography variant="h6" className="no-medications-title">
                    🎉 {t('noMedications')}
                  </Typography>
                  <Typography variant="body1" className="no-medications-text">
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
            className="reminder-dialog"
          >
            <DialogTitle className="reminder-dialog-title">
              {t('medicationReminder')}
            </DialogTitle>
            <DialogContent>
              <Typography variant="h6" className="reminder-medicine-name">
                {t('timeToTake')} {reminderDialog.medicine?.name}
              </Typography>
              <Typography variant="body1" className="reminder-dosage">
                {t('dosage')} {reminderDialog.medicine?.dosage}
              </Typography>
              <Typography variant="body2" color="textSecondary" className="reminder-time">
                {t('scheduledTime')} {reminderDialog.scheduledTime}
              </Typography>
              <Button
                onClick={() => triggerDemoNotification(reminderDialog.medicine)}
                variant="outlined"
                color="secondary"
                fullWidth
                className="test-notification-btn"
              >
                {t('testNotification')} ({user?.preferredLanguage || 'English'})
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
                {t('takenIt')}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </>
  );
};

export default ElderlyDashboard;

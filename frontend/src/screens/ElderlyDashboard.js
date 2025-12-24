import React, { useEffect, useState, useRef } from 'react';
import MedicineCard from '../components/MedicineCard';
import SOSButton from '../components/SOSButton';
import Header from '../components/Header';
import MedicineChatbot from '../components/MedicineChatbot';
import useMultilingualNotifications from '../hooks/useMultilingualNotifications';
import usePWAInstall from '../hooks/usePWAInstall';
import { getTodaysMedicines, markMedicineTaken } from '../utils/api';
import { Box, Typography, CircularProgress, Alert, Grid, Button, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Card, CardContent, Avatar, IconButton, AppBar, Toolbar, Select, MenuItem } from '@mui/material';
import { Medication, AccessTime, Favorite, VolumeUp } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import './DashboardScreen.css';

const ElderlyDashboard = () => {
  const { t, i18n } = useTranslation();
  const [todaysMedicines, setTodaysMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reminderDialog, setReminderDialog] = useState({ open: false, medicine: null, scheduledTime: null });
  const [currentTime, setCurrentTime] = useState(new Date());

  const { isInstallable, installPWA } = usePWAInstall();

  const token = localStorage.getItem('token');
  const [user, setUser] = React.useState(() => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('ElderlyDashboard - Loaded user data:', userData);
      return userData;
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

  // Set initial language based on user preference
  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  const handleLanguageChange = (newLang) => {
    const updatedUser = { ...(user || {}), preferredLanguage: newLang };
    setUser(updatedUser);
    try {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (e) {
      console.warn('Failed to persist user language preference', e);
    }
    // Update i18n language immediately
    const newLangCode = languageMap[newLang] || 'en';
    i18n.changeLanguage(newLangCode);
  };

  useEffect(() => {
    const fetchTodaysMedicines = async () => {
      setLoading(true);
      setError('');
      try {
        if (token) {
          const response = await getTodaysMedicines(token);
          // Sort medicines by creation date - newest first
          const sortedMedicines = (response.data || []).sort((a, b) => {
            return new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id);
          });
          setTodaysMedicines(sortedMedicines);
        }
      } catch (error) {
        setError(t('failedToLoadMedicines'));
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
        // Sort medicines by creation date - newest first
        const sortedMedicines = (response.data || []).sort((a, b) => {
          return new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id);
        });
        setTodaysMedicines(sortedMedicines);
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
      <Header />
      <Box className="dashboard-container">
        <Box className="dashboard-content">
          {/* SOS Section */}
          <Box className="sos-section">
            <Typography variant="body2" className="sos-text">
              {t('needHelpText')}
            </Typography>
            <Box className="sos-buttons">
              <SOSButton type="all" user={user} />
              <SOSButton type="relatives" user={user} />
            </Box>
          </Box>

          {/* Medicine Chatbot Widget */}
          <MedicineChatbot elderlyId={user?._id} />

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
                <Box className="medications-scroll-container">
                  <Box className="medications-horizontal-grid">
                    {todaysMedicines.map((med) => (
                      <Box key={med._id} className="medicine-item-wrapper">
                        <Card variant="outlined" className="medicine-item-card">
                          <CardContent className="medicine-item-content">
                            <Box sx={{ display: 'flex', gap: 1.5, height: '100%' }}>
                              {/* Left side: Medicine Card */}
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <MedicineCard medicine={med} onMarkTaken={handleTakeMedicine} />
                              </Box>
                              
                              {/* Right side: Action Button aligned with Scheduled Times */}
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'flex-end',
                                flexShrink: 0,
                                pb: 0.5
                              }}>
                                <Button
                                  variant="contained"
                                  color="success"
                                  size="medium"
                                  onClick={() => handleTakeMedicine(med._id, med.scheduledTimes[0]?.time)}
                                  className="taken-btn-side"
                                  sx={{
                                    textTransform: 'none',
                                    borderRadius: 1.5,
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    py: 1,
                                    px: 1.5,
                                    minWidth: '70px',
                                    height: 'fit-content',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {t('takenIt')}
                                </Button>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Box>
                    ))}
                  </Box>
                </Box>
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

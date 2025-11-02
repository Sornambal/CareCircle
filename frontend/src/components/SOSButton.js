import React, { useState, useEffect } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, CircularProgress } from '@mui/material';
import { Warning } from '@mui/icons-material';
import { sendSOSAlert, triggerVoiceSOS } from '../utils/api';
import { useTranslation } from 'react-i18next';

// Capacitor imports for mobile notifications
let LocalNotifications = null;
let Capacitor = null;
try {
  Capacitor = require('@capacitor/core').Capacitor;
  LocalNotifications = require('@capacitor/local-notifications').LocalNotifications;
} catch (e) {
  console.log('Capacitor not available, running in web mode');
}

const SOSButton = ({ type, user }) => {
  const [countdown, setCountdown] = useState(10);
  const [showDialog, setShowDialog] = useState(false);
  const [countdownInterval, setCountdownInterval] = useState(null);
  const [reminderInterval, setReminderInterval] = useState(null);
  const [alertSent, setAlertSent] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Get i18n instance
  const { t } = useTranslation();

  // Voice alert function with multilingual support
  const playVoiceAlert = (message) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);

      // Set language based on user's preference
      const langCode = user?.preferredLanguage === 'Tamil' ? 'ta-IN' :
                      user?.preferredLanguage === 'Hindi' ? 'hi-IN' :
                      user?.preferredLanguage === 'Malayalam' ? 'ml-IN' : 'en-IN';
      utterance.lang = langCode;
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Try to find appropriate voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice =>
        voice.lang.startsWith(langCode.split('-')[0])
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  };

  // Mobile notification function
  const sendMobileNotification = async (title, body) => {
    if (LocalNotifications && Capacitor?.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [{
            id: Date.now(),
            title: title,
            body: body,
            sound: 'default',
            actionTypeId: 'SOS_ALERT',
            extra: {
              sosType: type,
              timestamp: new Date().toISOString()
            }
          }]
        });
        console.log('Mobile notification scheduled');
      } catch (error) {
        console.error('Failed to schedule mobile notification:', error);
      }
    }
  };

  const handleSOSClick = () => {
    setShowDialog(true);
    setCountdown(10);
    setAlertSent(false);

    // Play initial voice alert in user's preferred language
    const initialMessage = user?.preferredLanguage === 'Tamil' ? "SOS எச்சரிக்கை தொடங்கப்பட்டது. உதவி வந்துகொண்டிருக்கிறது!" :
                          user?.preferredLanguage === 'Hindi' ? "SOS अलर्ट शुरू किया गया। मदद आ रही है!" :
                          user?.preferredLanguage === 'Malayalam' ? "SOS അലേർട്ട് ആരംഭിച്ചു. സഹായം വരുന്നു!" :
                          "SOS alert initiated. Help is on the way!";
    playVoiceAlert(initialMessage);

    // Set up 3 reminders with 1-minute intervals
    let reminderCount = 0;
    const maxReminders = 3;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          triggerSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Set up reminder intervals (every 1 minute for 3 reminders)
    const reminderInterval = setInterval(() => {
      reminderCount++;
      if (reminderCount <= maxReminders) {
        const reminderMessage = user?.preferredLanguage === 'Tamil' ? `SOS எச்சரிக்கை நினைவூட்டல் ${reminderCount}. உதவி தேவையா?` :
                               user?.preferredLanguage === 'Hindi' ? `SOS अलर्ट रिमाइंडर ${reminderCount}। क्या मदद चाहिए?` :
                               user?.preferredLanguage === 'Malayalam' ? `SOS അലേർട്ട് റിമൈൻഡർ ${reminderCount}। സഹായം ആവശ്യമാണോ?` :
                               `SOS alert reminder ${reminderCount}. Do you need help?`;
        playVoiceAlert(reminderMessage);
      } else {
        clearInterval(reminderInterval);
      }
    }, 60000); // 1 minute intervals

    setCountdownInterval(interval);
    setReminderInterval(reminderInterval);
  };

  const handleRejectSOS = () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    if (reminderInterval) {
      clearInterval(reminderInterval);
    }
    setShowDialog(false);
    setCountdown(10);
    setAlertSent(false);

    // Play cancellation voice alert
    playVoiceAlert("SOS alert cancelled.");
  };

  const triggerSOS = async () => {
    try {
      const location = { lat: 0, lng: 0 }; // Mock location - in real app, get from GPS
      const sosType = type === 'all' ? 'emergency' : 'family';

      setSending(true);

      // Trigger server-side voice call via Twilio
      try {
  const token = localStorage.getItem('token');
  // Do not pass caregiverPhone to let backend use authenticated user's registered phone
  const resp = await triggerVoiceSOS({ elderlyName: user?.elderlyName || 'Unknown', alertType: sosType }, token);
        console.log('triggerVoiceSOS response', resp.data);
      } catch (err) {
        console.error('triggerVoiceSOS failed', err?.response?.data || err.message);
        throw new Error('Failed to send voice SOS');
      }

      // Also send SMS/real-time (existing function)
      await sendSOSAlert(user?._id, location, localStorage.getItem('token'), sosType);

  setAlertSent(true);
  setSending(false);

      // Play success voice alert locally as well
      playVoiceAlert(user?.preferredLanguage === 'Tamil' ? 'அவசரம் அனுப்பப்பட்டது. உதவி வரும்!' : 'SOS alert sent successfully. Help is on the way!');

      // Send mobile notification
      const alertTypeText = type === 'all' ? 'EMERGENCY SOS' : 'FAMILY SOS';
      await sendMobileNotification(
        '🚨 SOS Alert Sent',
        `${alertTypeText} alert has been sent to your emergency contacts.`
      );

      // Auto-close dialog after 3 seconds
      setTimeout(() => {
        setShowDialog(false);
        setCountdown(10);
        setAlertSent(false);
      }, 3000);

    } catch (error) {
      console.error('Error sending SOS:', error);
      const backendMessage = error?.response?.data?.message || error?.message || 'Failed to send SOS alert';
      playVoiceAlert(user?.preferredLanguage === 'Tamil' ? 'SOS அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும்.' : `Failed to send SOS alert. ${backendMessage}`);
      alert(`Failed to send SOS alert. ${backendMessage}`);
      setShowDialog(false);
      setCountdown(10);
      setSending(false);
    } finally {
      // stop any countdowns
      if (countdownInterval) clearInterval(countdownInterval);
      if (reminderInterval) clearInterval(reminderInterval);
    }
  };

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
      if (reminderInterval) {
        clearInterval(reminderInterval);
      }
    };
  }, [countdownInterval, reminderInterval]);

  return (
    <>
      <Button
        variant="contained"
        color="error"
        size="large"
        onClick={handleSOSClick}
        disabled={showDialog}
        sx={{
          minWidth: 120,
          minHeight: 60,
          fontSize: '1.2rem',
          fontWeight: 'bold',
          boxShadow: 3,
          '&:hover': {
            boxShadow: 6,
          },
        }}
      >
        <Warning sx={{ mr: 1 }} />
        {type === 'all' ? t('sosAll') : t('sosRelatives')}
      </Button>

      <Dialog
        open={showDialog}
        onClose={handleRejectSOS}
        fullScreen
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(244, 67, 54, 0.95)', // Red overlay
            color: 'white',
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
          {alertSent ? t('sosTriggered') : t('sendingEmergencyAlert')}
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', p: 4 }}>
          {!alertSent ? (
            <>
              <Typography variant="h1" sx={{ fontSize: '8rem', fontWeight: 'bold', color: 'white', mb: 2 }}>
                {countdown}
              </Typography>
              <Typography variant="h5" sx={{ mb: 2 }}>
                {type === 'all' ? t('alertingAll') : t('alertingFamily')}
              </Typography>
              <Typography variant="h6">
                {t('tapToCancel')}
              </Typography>
            </>
          ) : (
            <Box>
              <Typography variant="h4" sx={{ mb: 2 }}>
                {t('alertsSentTo')}
              </Typography>
              <Typography variant="h6">
                {type === 'all' ? t('emergencyContactsList') : t('familyContactsList')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', p: 4 }}>
          {!alertSent ? (
            sending ? (
              <Button
                variant="contained"
                color="secondary"
                size="large"
                disabled
                sx={{
                  minWidth: 250,
                  minHeight: 80,
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  backgroundColor: 'white',
                  color: 'error.main',
                }}
              >
                <CircularProgress size={24} color="inherit" />
              </Button>
            ) : (
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={handleRejectSOS}
                sx={{
                  minWidth: 250,
                  minHeight: 80,
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  backgroundColor: 'white',
                  color: 'error.main',
                  '&:hover': {
                    backgroundColor: 'grey.100',
                  },
                }}
              >
                {t('cancelAlert')}
              </Button>
            )
          ) : (
            <Button
              variant="contained"
              size="large"
              onClick={() => setShowDialog(false)}
              sx={{
                minWidth: 200,
                minHeight: 60,
                fontSize: '1.2rem',
                fontWeight: 'bold',
                backgroundColor: 'white',
                color: 'success.main',
              }}
            >
              OK
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SOSButton;

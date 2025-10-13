import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Chip } from '@mui/material';
import { Warning, LocationOn, Phone } from '@mui/icons-material';

const SOSNotification = ({ notification, onClose }) => {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (notification) {
      setOpen(true);
      setDialogOpen(true);
    }
  }, [notification]);

  const handleClose = () => {
    setOpen(false);
    setDialogOpen(false);
    onClose();
  };

  if (!notification) return null;

  const isEmergency = notification.alertType === 'emergency';

  return (
    <>
      {/* Snackbar for immediate notification */}
      <Snackbar
        open={open}
        autoHideDuration={10000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleClose}
          severity={isEmergency ? 'error' : 'warning'}
          variant="filled"
          sx={{ width: '100%' }}
        >
          <strong>{isEmergency ? 'EMERGENCY' : 'FAMILY'} SOS ALERT</strong><br />
          {notification.elderlyName} needs assistance!
        </Alert>
      </Snackbar>

      {/* Detailed Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            border: isEmergency ? '4px solid #d32f2f' : '4px solid #f57c00',
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: isEmergency ? '#ffebee' : '#fff3e0',
          color: isEmergency ? '#d32f2f' : '#f57c00',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Warning />
          {isEmergency ? 'EMERGENCY' : 'FAMILY'} SOS ALERT
          <Chip
            label={isEmergency ? 'URGENT' : 'ATTENTION'}
            color={isEmergency ? 'error' : 'warning'}
            size="small"
            sx={{ ml: 'auto' }}
          />
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="h6" gutterBottom>
            {notification.elderlyName} has triggered an SOS alert
          </Typography>

          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
              <strong>Location:</strong> {notification.location?.lat || 'Unknown'}, {notification.location?.lng || 'Unknown'}
            </Typography>

            <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Phone sx={{ mr: 1, color: 'text.secondary' }} />
              <strong>Contacts Alerted:</strong> {notification.contactsAlerted} of {notification.details?.totalContacts || 0}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              <strong>Time:</strong> {new Date(notification.timestamp).toLocaleString()}
            </Typography>
          </Box>

          {notification.details && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>SMS Sent:</strong> {notification.details.smsSent}<br />
                {notification.details.voiceCalls > 0 && (
                  <><strong>Voice Calls:</strong> {notification.details.voiceCalls}<br /></>
                )}
                <strong>Total Contacts:</strong> {notification.details.totalContacts}
              </Typography>
            </Box>
          )}

          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Emergency contacts have been notified. Please check on {notification.elderlyName} immediately.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} variant="outlined">
            Acknowledge
          </Button>
          <Button
            onClick={handleClose}
            variant="contained"
            color={isEmergency ? 'error' : 'warning'}
            autoFocus
          >
            I Will Check
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SOSNotification;

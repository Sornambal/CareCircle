import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';
import { Warning } from '@mui/icons-material';
import { sendSOSAlert } from '../utils/api';

const SOSButton = ({ type }) => {
  const [countdown, setCountdown] = useState(10);
  const [showDialog, setShowDialog] = useState(false);
  const [countdownInterval, setCountdownInterval] = useState(null);

  const handleSOSClick = () => {
    setShowDialog(true);
    setCountdown(10);

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

    setCountdownInterval(interval);
  };

  const handleRejectSOS = () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    setShowDialog(false);
    setCountdown(10);
  };

  const triggerSOS = async () => {
    try {
      await sendSOSAlert(null, null, localStorage.getItem('token'));
      alert('SOS alert sent successfully!');
    } catch (error) {
      console.error('Error sending SOS:', error);
      alert('Failed to send SOS alert');
    }
    setShowDialog(false);
  };

  return (
    <>
      <Button
        variant="contained"
        color="error"
        size="large"
        onClick={handleSOSClick}
        sx={{
          minWidth: 120,
          minHeight: 60,
          fontSize: '1.2rem',
          fontWeight: 'bold',
        }}
      >
        SOS {type === 'all' ? 'All' : 'Relatives'}
      </Button>

      <Dialog open={showDialog} onClose={handleRejectSOS} fullScreen>
        <DialogTitle sx={{ textAlign: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
          Sending emergency alert in...
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h1" sx={{ fontSize: '6rem', fontWeight: 'bold', color: 'error.main' }}>
            {countdown}
          </Typography>
          <Typography variant="h6" sx={{ mt: 2 }}>
            Tap "Reject SOS" to cancel
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', p: 4 }}>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={handleRejectSOS}
            sx={{
              minWidth: 200,
              minHeight: 80,
              fontSize: '1.5rem',
              fontWeight: 'bold',
            }}
          >
            Reject SOS
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SOSButton;

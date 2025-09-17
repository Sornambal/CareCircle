import React from 'react';
import { Fab } from '@mui/material';
import { Warning } from '@mui/icons-material';

const SOSButton = ({ onClick }) => {
  return (
    <Fab
      color="error"
      aria-label="SOS"
      onClick={onClick}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: 64,
        height: 64,
        boxShadow: 3,
      }}
    >
      <Warning />
    </Fab>
  );
};

export default SOSButton;

import React from 'react';
import { Box, Typography, Avatar, Button, Stack } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const ProfileCard = ({ user }) => {
  if (!user) return null;

  const { name, age, role, doctorContact, helperContact } = user;

  const handleCall = (phone) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleWhatsApp = (phone) => {
    const url = `https://wa.me/${phone}`;
    window.open(url, '_blank');
  };

  return (
    <Box
      sx={{
        p: 2,
        border: '1px solid #ccc',
        borderRadius: 2,
        mb: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        backgroundColor: '#f9f9f9',
      }}
    >
      <Avatar sx={{ width: 64, height: 64 }}>{name ? name.charAt(0) : '?'}</Avatar>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h6">{name}</Typography>
        <Typography variant="body2">Age: {age}</Typography>
        <Typography variant="body2">Role: {role}</Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        {doctorContact && (
          <>
            <Button
              variant="outlined"
              startIcon={<PhoneIcon />}
              onClick={() => handleCall(doctorContact)}
            >
              Doctor Call
            </Button>
            <Button
              variant="outlined"
              startIcon={<WhatsAppIcon />}
              onClick={() => handleWhatsApp(doctorContact)}
            >
              Doctor WhatsApp
            </Button>
          </>
        )}
        {helperContact && (
          <>
            <Button
              variant="outlined"
              startIcon={<PhoneIcon />}
              onClick={() => handleCall(helperContact)}
            >
              Helper Call
            </Button>
            <Button
              variant="outlined"
              startIcon={<WhatsAppIcon />}
              onClick={() => handleWhatsApp(helperContact)}
            >
              Helper WhatsApp
            </Button>
          </>
        )}
      </Stack>
    </Box>
  );
};

export default ProfileCard;

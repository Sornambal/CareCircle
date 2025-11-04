import React from 'react';
import { Card, CardContent, Typography, Box, Button, Chip } from '@mui/material';

const MedicineCard = ({ medicine, onMarkTaken }) => {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          {medicine.name}
        </Typography>
        <Box sx={{ mb: 1 }}>
          <Typography variant="body2"><strong>Dosage:</strong> {medicine.dosage}</Typography>
          <Typography variant="body2"><strong>Prescribed Days:</strong> {medicine.prescribedDays}</Typography>
          <Typography variant="body2"><strong>Doctor Contact:</strong> {medicine.doctorContact}</Typography>
          {medicine.otherContacts && (
            <Typography variant="body2"><strong>Other Contacts:</strong> {medicine.otherContacts}</Typography>
          )}
        </Box>
        {medicine.scheduledTimes && medicine.scheduledTimes.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600 }}><strong>Scheduled Times:</strong></Typography>
            {medicine.scheduledTimes.map((scheduled, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: 1.5,
                  mb: 2,
                  p: 1.5,
                  backgroundColor: scheduled.status === 'taken' ? '#e8f5e9' : '#fff3e0',
                  borderRadius: 2,
                  border: `1px solid ${scheduled.status === 'taken' ? '#c8e6c9' : '#ffe0b2'}`
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.95rem' }}>
                    {scheduled.time}
                  </Typography>
                  <Chip
                    label={scheduled.status === 'taken' ? 'Taken' : 'Pending'}
                    color={scheduled.status === 'taken' ? 'success' : 'warning'}
                    size="small"
                    sx={{ fontWeight: 500 }}
                  />
                </Box>
                {scheduled.status === 'pending' && onMarkTaken && (
                  <Button
                    variant="contained"
                    color="primary"
                    size="medium"
                    onClick={() => onMarkTaken(medicine._id, scheduled.time)}
                    sx={{ 
                      textTransform: 'none',
                      borderRadius: 2,
                      fontWeight: 600,
                      py: 1,
                      boxShadow: 2
                    }}
                    fullWidth
                  >
                    Mark as Taken
                  </Button>
                )}
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default MedicineCard;

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
            <Typography variant="body2" sx={{ mb: 1 }}><strong>Scheduled Times:</strong></Typography>
            {medicine.scheduledTimes.map((scheduled, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>{scheduled.time}</Typography>
                  <Chip
                    label={scheduled.status === 'taken' ? 'Taken' : 'Pending'}
                    color={scheduled.status === 'taken' ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
                {scheduled.status === 'pending' && onMarkTaken && (
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => onMarkTaken(medicine._id, scheduled.time)}
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

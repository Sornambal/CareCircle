import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

const MedicineCard = ({ medicine }) => {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          {medicine.name}
        </Typography>
        <Box sx={{ mb: 1 }}>
          <Typography variant="body2"><strong>Dosage:</strong> {medicine.dosage}</Typography>
          <Typography variant="body2"><strong>Time:</strong> {medicine.time}</Typography>
          <Typography variant="body2"><strong>Prescribed Days:</strong> {medicine.prescribedDays}</Typography>
          <Typography variant="body2"><strong>Doctor Contact:</strong> {medicine.doctorContact}</Typography>
          {medicine.otherContacts && (
            <Typography variant="body2"><strong>Other Contacts:</strong> {medicine.otherContacts}</Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default MedicineCard;

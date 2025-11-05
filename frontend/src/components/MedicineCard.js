import React from 'react';
import { Card, CardContent, Typography, Box, Button, Chip } from '@mui/material';

const MedicineCard = ({ medicine, onMarkTaken, showButton = false, buttonText = 'Mark Taken' }) => {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Typography variant="h6" component="div" gutterBottom sx={{ fontWeight: 600, color: '#2c3e50', fontSize: '1rem', mb: 1 }}>
        {medicine.name}
      </Typography>
      <Box sx={{ mb: 1.5, pb: 1.5, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.8rem' }}>
          <strong>Dosage:</strong> {medicine.dosage}
        </Typography>
        <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.8rem' }}>
          <strong>Days:</strong> {medicine.prescribedDays}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
          <strong>Doctor:</strong> {medicine.doctorContact}
        </Typography>
      </Box>
      {medicine.scheduledTimes && medicine.scheduledTimes.length > 0 && (
        <Box sx={{ mt: 'auto' }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, fontSize: '0.85rem', color: '#555' }}>
            Scheduled Times:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            {/* Left side: Scheduled times list */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, flex: 1, overflow: 'auto', maxHeight: '100px' }}>
              {medicine.scheduledTimes.map((scheduled, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 0.5,
                    p: 0.75,
                    backgroundColor: scheduled.status === 'taken' ? '#e8f5e9' : '#fff3e0',
                    borderRadius: 1,
                    border: `1px solid ${scheduled.status === 'taken' ? '#c8e6c9' : '#ffe0b2'}`,
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: '0.85rem',
                      color: '#333',
                      lineHeight: 1.2
                    }}
                  >
                    {scheduled.time}
                  </Typography>
                  <Chip
                    label={scheduled.status === 'taken' ? 'Taken' : 'Pending'}
                    color={scheduled.status === 'taken' ? 'success' : 'warning'}
                    size="small"
                    sx={{ 
                      fontWeight: 500,
                      fontSize: '0.65rem',
                      height: '18px',
                      width: 'fit-content',
                      '& .MuiChip-label': {
                        px: 0.75
                      }
                    }}
                  />
                </Box>
              ))}
            </Box>
            
            {/* Right side: Action button (passed from parent) */}
            {showButton && (
              <Box sx={{ flexShrink: 0 }}>
                {/* Button will be rendered by parent component */}
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MedicineCard;

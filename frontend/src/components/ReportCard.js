import React from 'react';
import { Card, CardContent, Typography, Box, LinearProgress } from '@mui/material';

const ReportCard = ({ adherence }) => {
  // adherence: number between 0 and 100 representing % adherence
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Medicine Adherence
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress variant="determinate" value={adherence} />
          </Box>
          <Box sx={{ minWidth: 35 }}>
            <Typography variant="body2" color="text.secondary">{`${Math.round(adherence)}%`}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ReportCard;

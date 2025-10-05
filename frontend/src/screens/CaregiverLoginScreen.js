import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { caregiverLogin } from '../utils/api';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';

const CaregiverLoginScreen = () => {
  const [formData, setFormData] = useState({
    caregiverName: '',
    caregiverPhone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await caregiverLogin(formData);
      if (response.status === 200 && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data));
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error during login');
    }
    setLoading(false);
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', p: 3, boxShadow: 3, borderRadius: 2, mt: 5 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Caregiver Login
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Caregiver Name"
          name="caregiverName"
          value={formData.caregiverName}
          onChange={handleChange}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="Caregiver Phone Number"
          name="caregiverPhone"
          type="tel"
          value={formData.caregiverPhone}
          onChange={handleChange}
          fullWidth
          required
          margin="normal"
        />
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading} sx={{ mt: 3 }}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </Box>
  );
};

export default CaregiverLoginScreen;

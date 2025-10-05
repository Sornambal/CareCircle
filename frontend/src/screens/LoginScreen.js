import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/api';
import { Box, Button, TextField, Typography, MenuItem, Select, FormControl, InputLabel, Alert, CircularProgress } from '@mui/material';

const LoginScreen = () => {
  const [role, setRole] = useState('elderly');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Commenting out auto-login for elderly to disable VIP access card flow temporarily
  // useEffect(() => {
  //   const deviceToken = localStorage.getItem('deviceToken');
  //   if (deviceToken) {
  //     // Auto-login for elderly
  //     setAutoLoading(true);
  //     login({ deviceToken, role: 'elderly' })
  //       .then((response) => {
  //         localStorage.setItem('token', response.data.token);
  //         localStorage.setItem('user', JSON.stringify(response.data));
  //         navigate('/home');
  //       })
  //       .catch((err) => {
  //         console.error('Auto-login failed:', err);
  //         localStorage.removeItem('deviceToken');
  //         setAutoLoading(false);
  //       });
  //   }
  // }, [navigate]);

  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setError('');
  };

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = { ...formData, role };
      const response = await login(data);
      if (response.status === 200 && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data));
        if (response.data.deviceToken) {
          localStorage.setItem('deviceToken', response.data.deviceToken);
        }
        navigate(response.data.role === 'caregiver' ? '/dashboard' : '/dashboard');
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error during login');
    }
    setLoading(false);
  };

  if (autoLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Logging in...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', p: 3, boxShadow: 3, borderRadius: 2, mt: 5 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {role === 'caregiver' ? 'Caregiver Login' : 'Elderly User Login'}
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {role === 'caregiver' ? 'Enter your caregiver details (name, phone, password) to access the dashboard.' : 'Enter caregiver details to setup or login as elderly user.'}
      </Typography>
      <FormControl fullWidth margin="normal">
        <InputLabel id="role-label">Login As</InputLabel>
        <Select
          labelId="role-label"
          value={role}
          label="Login As"
          onChange={handleRoleChange}
        >
          <MenuItem value="elderly">Elderly User</MenuItem>
          <MenuItem value="caregiver">Caregiver</MenuItem>
        </Select>
      </FormControl>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="Phone Number"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          value={formData.password}
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

export default LoginScreen;

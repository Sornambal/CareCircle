import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../utils/api';
import { Box, Button, TextField, Typography, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material';

const RegistrationScreen = () => {
  const [formData, setFormData] = useState({
    elderlyName: '',
    elderlyAge: '',
    elderlyPhone: '',
    elderlyEmail: '',
    caregiverName: '',
    caregiverPhone: '',
    caregiverEmail: '',
    preferredLanguage: 'English',
    password: '',
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
      const response = await registerUser(formData);
      if (response.status === 201 && response.data._id) {
        alert('Registration successful! Please login.');
        navigate('/login');
      } else {
        setError(response.data.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error during registration');
    }
    setLoading(false);
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3, boxShadow: 3, borderRadius: 2, mt: 5 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Unified Account Registration
      </Typography>
      <form onSubmit={handleSubmit}>
        <Typography variant="h6" gutterBottom>
          Elderly Person's Details
        </Typography>
        <TextField
          label="Full Name"
          name="elderlyName"
          value={formData.elderlyName}
          onChange={handleChange}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="Age"
          name="elderlyAge"
          type="number"
          value={formData.elderlyAge}
          onChange={handleChange}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="Phone Number"
          name="elderlyPhone"
          type="tel"
          value={formData.elderlyPhone}
          onChange={handleChange}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="Email Address"
          name="elderlyEmail"
          type="email"
          value={formData.elderlyEmail}
          onChange={handleChange}
          fullWidth
          required
          margin="normal"
        />

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Caregiver's Details
        </Typography>
        <TextField
          label="Full Name"
          name="caregiverName"
          value={formData.caregiverName}
          onChange={handleChange}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="Phone Number"
          name="caregiverPhone"
          type="tel"
          value={formData.caregiverPhone}
          onChange={handleChange}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="Email Address"
          name="caregiverEmail"
          type="email"
          value={formData.caregiverEmail}
          onChange={handleChange}
          fullWidth
          required
          margin="normal"
        />

        <FormControl fullWidth margin="normal">
          <InputLabel id="preferredLanguage-label">Preferred Language</InputLabel>
          <Select
            labelId="preferredLanguage-label"
            name="preferredLanguage"
            value={formData.preferredLanguage}
            label="Preferred Language"
            onChange={handleChange}
          >
            <MenuItem value="English">English</MenuItem>
            <MenuItem value="Tamil">Tamil</MenuItem>
            <MenuItem value="Spanish">Spanish</MenuItem>
            <MenuItem value="French">French</MenuItem>
          </Select>
        </FormControl>

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
          {loading ? 'Registering...' : 'Register'}
        </Button>
      </form>
      <Typography sx={{ mt: 2, textAlign: 'center' }}>
        Already have an account? <Link to="/login">Login</Link>
      </Typography>
    </Box>
  );
};

export default RegistrationScreen;

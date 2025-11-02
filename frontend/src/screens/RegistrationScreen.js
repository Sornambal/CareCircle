import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../utils/api';
import { Box, Button, TextField, Typography, FormControl, InputLabel, Select, MenuItem, Alert, Card, CardContent, Avatar } from '@mui/material';
import { PersonAdd, Favorite } from '@mui/icons-material';

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
    <Box sx={{
      minHeight: '100vh',
      background: '#F7F9FA',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4
    }}>
      <Card sx={{
        maxWidth: 600,
        width: '100%',
        mx: 3,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 4,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.18)'
      }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 2,
              bgcolor: '#007C91',
              fontSize: 36
            }}>
              <PersonAdd />
            </Avatar>
            <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#263238', fontWeight: 'bold' }}>
              Join CareCircle
            </Typography>
            <Typography variant="body1" sx={{ color: '#546E7A' }}>
              Create your unified account for elderly care management
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Typography variant="h6" gutterBottom sx={{ color: '#007C91', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Favorite sx={{ fontSize: 20 }} />
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
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <Typography variant="h6" gutterBottom sx={{ mt: 4, color: '#007C91', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonAdd sx={{ fontSize: 20 }} />
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
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel id="preferredLanguage-label">Preferred Language</InputLabel>
              <Select
                labelId="preferredLanguage-label"
                name="preferredLanguage"
                value={formData.preferredLanguage}
                label="Preferred Language"
                onChange={handleChange}
                sx={{ borderRadius: 2, minWidth: 120 }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 200,
                    },
                  },
                }}
              >
                <MenuItem value="Tamil">Tamil</MenuItem>
                <MenuItem value="English">English</MenuItem>
                <MenuItem value="Telugu">Telugu</MenuItem>
                <MenuItem value="Hindi">Hindi</MenuItem>
                <MenuItem value="Malayalam">Malayalam</MenuItem>
               
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
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: 2,
                background: '#007C91',
                '&:hover': { background: '#005F6B' },
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
          <Box sx={{ mt: 3, textAlign: 'center', color: '#546E7A', display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Typography component="span">Already have an account?</Typography>
            <Link to="/login" style={{ color: '#007C91', textDecoration: 'none', fontWeight: 'bold' }}>
              Login here
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegistrationScreen;

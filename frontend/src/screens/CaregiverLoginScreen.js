import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { caregiverLogin } from '../utils/api';
import { Box, Button, TextField, Typography, Alert, Card, CardContent, Avatar } from '@mui/material';
import { Person, Favorite } from '@mui/icons-material';

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
    <Box sx={{
      minHeight: '100vh',
      background: '#F7F9FA',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4
    }}>
      <Card sx={{
        maxWidth: 450,
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
              <Person />
            </Avatar>
            <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#263238', fontWeight: 'bold' }}>
              Caregiver Portal
            </Typography>
            <Typography variant="body1" sx={{ color: '#546E7A' }}>
              Access your elderly care management dashboard
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              label="Caregiver Name"
              name="caregiverName"
              value={formData.caregiverName}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <Typography sx={{ mt: 3, textAlign: 'center', color: '#546E7A' }}>
            Need to register?{' '}
            <Link to="/register" style={{ color: '#007C91', textDecoration: 'none', fontWeight: 'bold' }}>
              Create account
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CaregiverLoginScreen;

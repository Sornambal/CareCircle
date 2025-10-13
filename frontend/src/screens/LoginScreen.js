import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../utils/api';
import { Box, Button, TextField, Typography, MenuItem, Select, FormControl, InputLabel, Alert, CircularProgress, Card, CardContent, Avatar } from '@mui/material';
import { Login, Favorite } from '@mui/icons-material';

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
              <Login />
            </Avatar>
            <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#263238', fontWeight: 'bold' }}>
              Welcome Back
            </Typography>
            <Typography variant="body1" sx={{ color: '#546E7A' }}>
              Sign in to your CareCircle account
            </Typography>
          </Box>

          <FormControl fullWidth margin="normal">
            <InputLabel id="role-label">Login As</InputLabel>
            <Select
              labelId="role-label"
              value={role}
              label="Login As"
              onChange={handleRoleChange}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="elderly">Elderly User</MenuItem>
              <MenuItem value="caregiver">Caregiver</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" sx={{ mb: 2, color: '#546E7A', textAlign: 'center' }}>
            {role === 'caregiver' ? 'Enter your caregiver details to access the dashboard.' : 'Enter caregiver details to setup or login as elderly user.'}
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#007C91', textDecoration: 'none', fontWeight: 'bold' }}>
              Register here
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginScreen;

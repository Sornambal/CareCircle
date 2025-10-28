import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography, Button, Box, CircularProgress } from '@mui/material';

import RegistrationScreen from './screens/RegistrationScreen';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import SOSNotification from './components/SOSNotification';
import useSocket from './hooks/useSocket';


const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4caf50', // Softer green for elderly friendly
    },
    secondary: {
      main: '#ff9800',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

const Navigation = ({ sosNotification, onSOSClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token || location.pathname === '/' || location.pathname === '/login') {
    return null;
  }

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          CareCircle
        </Typography>
        {user.role === 'caregiver' && (
          <Button color="inherit" onClick={() => navigate('/dashboard')}>
            Dashboard
          </Button>
        )}
        <Button color="inherit" onClick={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }}>
          Logout
        </Button>
      </Toolbar>
      {/* SOS Notification Component */}
      <SOSNotification notification={sosNotification} onClose={onSOSClose} />
    </AppBar>
  );
};

function App() {
  const [sosNotification, setSOSNotification] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Handle SOS notifications
  const handleSOSNotification = (notification) => {
    setSOSNotification(notification);
  };

  const handleSOSClose = () => {
    setSOSNotification(null);
  };

  // Initialize socket connection for logged-in users
  useSocket(user._id, handleSOSNotification);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navigation sosNotification={sosNotification} onSOSClose={handleSOSClose} />
          <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
            <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>}>
              <Routes>
                {/* make the root path render the login page */}
                <Route path="/" element={<LoginScreen />} />
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/register" element={<RegistrationScreen />} />
                <Route path="/dashboard" element={<DashboardScreen />} />
              </Routes>
            </Suspense>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;

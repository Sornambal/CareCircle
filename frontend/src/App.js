import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography, Button, Box, CircularProgress } from '@mui/material';

import RegistrationScreen from './screens/RegistrationScreen';
import LoginScreen from './screens/LoginScreen';
import ElderlyDashboard from './screens/ElderlyDashboard';
import CaregiverDashboard from './screens/CaregiverDashboard';
import SOSNotification from './components/SOSNotification';
import RequireAuth from './components/RequireAuth';
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
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  });

  if (!user || location.pathname === '/' || location.pathname === '/login') {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          CareCircle
        </Typography>
        {user.role === 'caregiver' && (
          <Button 
            color="inherit" 
            onClick={() => navigate('/caregiver-dashboard')}
          >
            Dashboard
          </Button>
        )}
        {user.role === 'elderly' && (
          <Button 
            color="inherit" 
            onClick={() => navigate('/elderly-dashboard')}
          >
            Dashboard
          </Button>
        )}
        <Button color="inherit" onClick={handleLogout}>
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
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (!token || !user) {
        localStorage.clear();
      }
      setInitialized(true);
    };
    
    checkAuth();
  }, []);

  // Handle SOS notifications
  const handleSOSNotification = (notification) => {
    setSOSNotification(notification);
  };

  const handleSOSClose = () => {
    setSOSNotification(null);
  };

  // Initialize socket connection for logged-in users
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  useSocket(storedUser._id, handleSOSNotification);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navigation sosNotification={sosNotification} onSOSClose={handleSOSClose} />
          <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
            <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LoginScreen />} />
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/register" element={<RegistrationScreen />} />

                {/* Role-specific dashboards - using window.location in RequireAuth */}
                <Route 
                  path="/elderly-dashboard" 
                  element={
                    <RequireAuth role="elderly">
                      <ElderlyDashboard />
                    </RequireAuth>
                  } 
                />

                <Route 
                  path="/caregiver-dashboard" 
                  element={
                    <RequireAuth role="caregiver">
                      <CaregiverDashboard />
                    </RequireAuth>
                  } 
                />

                {/* Force login for unknown routes */}
                <Route 
                  path="*" 
                  element={
                    <Navigate to="/login" replace />
                  } 
                />
              </Routes>
            </Suspense>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;

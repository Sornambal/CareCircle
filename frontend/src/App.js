import React, { Suspense, useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
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
import i18n from './utils/i18n';


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
          {i18n.t('careCircle')}
        </Typography>

        <Button color="inherit" onClick={handleLogout}>
          {i18n.t('logout')}
        </Button>
      </Toolbar>
      {/* SOS Notification Component */}
      <SOSNotification notification={sosNotification} onClose={onSOSClose} />
    </AppBar>
  );
};

const AppLayout = ({ sosNotification, onSOSClose, children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navigation sosNotification={sosNotification} onSOSClose={onSOSClose} />
      <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
        <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>}>
          <Outlet />
        </Suspense>
      </Box>
    </Box>
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

  // Update i18n language when user data changes
  useEffect(() => {
    const updateLanguage = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          const languageMap = {
            'English': 'en',
            'Tamil': 'ta',
            'Telugu': 'te',
            'Hindi': 'hi',
            'Malayalam': 'ml'
          };
          const language = languageMap[user.preferredLanguage] || 'en';
          if (i18n.language !== language) {
            i18n.changeLanguage(language);
          }
        }
      } catch (e) {
        console.warn('Error updating language:', e);
      }
    };

    updateLanguage();
  }, [initialized]);

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

  const router = createBrowserRouter([
    {
      path: '/',
      element: <AppLayout sosNotification={sosNotification} onSOSClose={handleSOSClose} />,
      children: [
        { index: true, element: <LoginScreen /> },
        { path: 'login', element: <LoginScreen /> },
        { path: 'register', element: <RegistrationScreen /> },
        { path: 'elderly-dashboard', element: <RequireAuth role="elderly"><ElderlyDashboard /></RequireAuth> },
        { path: 'caregiver-dashboard', element: <RequireAuth role="caregiver"><CaregiverDashboard /></RequireAuth> },
        { path: '*', element: <Navigate to="/login" replace /> },
      ],
    },
  ]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} future={{ v7_startTransition: true, v7_relativeSplatPath: true }} />
    </ThemeProvider>
  );
}

export default App;

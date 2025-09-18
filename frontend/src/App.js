import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography, Button, Box, CircularProgress } from '@mui/material';


const RegistrationScreen = React.lazy(() => import('./screens/RegistrationScreen'));
const LoginScreen = React.lazy(() => import('./screens/LoginScreen'));
const DashboardScreen = React.lazy(() => import('./screens/DashboardScreen'));
const ChatbotScreen = React.lazy(() => import('./screens/ChatbotScreen'));

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

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  if (!token || location.pathname === '/' || location.pathname === '/login') {
    return null;
  }

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          CareCircle
        </Typography>
        <Button color="inherit" onClick={() => navigate('/dashboard')}>
          Dashboard
        </Button>
        <Button color="inherit" onClick={() => navigate('/chatbot')}>
          Chatbot
        </Button>
        <Button color="inherit" onClick={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navigation />
          <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
            <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>}>
              <Routes>
                <Route path="/" element={<RegistrationScreen />} />
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/dashboard" element={<DashboardScreen />} />
                <Route path="/chatbot" element={<ChatbotScreen />} />
              </Routes>
            </Suspense>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;

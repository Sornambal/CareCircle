import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, elderlyLogin } from '../utils/api';
import { FaUser, FaLock, FaPhone } from 'react-icons/fa';
import { IconButton } from '@mui/material';
import { GetApp } from '@mui/icons-material';
import usePWAInstall from '../hooks/usePWAInstall';
import './LoginScreen.css';

const LoginScreen = () => {
  const [isActive, setIsActive] = useState(false);
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
  const { isInstallable, installPWA } = usePWAInstall;

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = { ...formData, role };
      let response;
      if (role === 'elderly') {
        response = await elderlyLogin({ name: formData.name, phone: formData.phone, password: formData.password });
      } else {
        response = await login({ caregiverName: formData.name, caregiverPhone: formData.phone, password: formData.password, role: 'caregiver' });
      }
      if (response.status === 200 && response.data.token) {
        // Clear any existing auth data first
        localStorage.clear();
        
        // Set the role explicitly based on the login form
        const userData = {
          ...response.data,
          role: role // Use the role from login form
        };
        
        console.log('Setting user role:', role);
        
        // Store auth data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        if (response.data.deviceToken) {
          localStorage.setItem('deviceToken', response.data.deviceToken);
        }

        // Force a small delay to ensure storage is set
        setTimeout(() => {
          if (role === 'elderly') {
            console.log('Navigating to elderly dashboard...');
            window.location.href = '/elderly-dashboard';
          } else {
            console.log('Navigating to caregiver dashboard...');
            window.location.href = '/caregiver-dashboard';
          }
        }, 100);
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error during login');
    }
    setLoading(false);
  };

  const handleToggleToCaregiver = () => {
    setIsActive(true);
    setRole('caregiver');
    setError('');
    setFormData({ name: '', phone: '', password: '' });
  };

  const handleToggleToElderly = () => {
    setIsActive(false);
    setRole('elderly');
    setError('');
    setFormData({ name: '', phone: '', password: '' });
  };

  if (autoLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Logging in...</p>
      </div>
    );
  }

  return (
    <div className={`container ${isActive ? 'active' : ''}`}>
      {/* PWA Install Button */}
      {isInstallable && (
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
          <IconButton
            title="Install CareCircle App"
            onClick={() => {
              console.log('Install button clicked');
              installPWA();
            }}
            style={{ backgroundColor: '#4caf50', color: 'white' }}
          >
            <GetApp />
          </IconButton>
        </div>
      )}

      {/* Elderly User Login Form */}
      <div className="form-box login">
        <form onSubmit={handleSubmit}>
          <h1>Hello Elderly User</h1>
          <p className="subtitle">Enter elderly name, phone and caregiver password to login</p>

          <div className="input-box">
            <input
              type="text"
              name="name"
              placeholder="Elderly Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <FaUser className="input-icon" />
          </div>

          <div className="input-box">
            <input
              type="tel"
              name="phone"
              placeholder="Elderly Phone Number"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            <FaPhone className="input-icon" />
          </div>

          <div className="input-box">
            <input
              type="password"
              name="password"
              placeholder="Caregiver Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <FaLock className="input-icon" />
          </div>

          {error && !isActive && <div className="error-message">{error}</div>}

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <p className="register-link">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </form>
      </div>

      {/* Caregiver Login Form */}
      <div className="form-box register">
        <form onSubmit={handleSubmit}>
          <h1>Welcome Caregiver</h1>
          <p className="subtitle">Enter your details to access the dashboard</p>
          
          <div className="input-box">
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <FaUser className="input-icon" />
          </div>

          <div className="input-box">
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            <FaPhone className="input-icon" />
          </div>

          <div className="input-box">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <FaLock className="input-icon" />
          </div>

          {error && isActive && <div className="error-message">{error}</div>}

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <p className="register-link">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </form>
      </div>

      {/* Toggle Panels */}
      <div className="toggle-box">
        <div className="toggle-panel toggle-left">
          <h1>Click<br/> Below Caregiver!</h1>
          <p>To view the Insights</p>
          <button type="button" className="btn register-btn" onClick={handleToggleToCaregiver}>
            Caregiver
          </button>
        </div>

        <div className="toggle-panel toggle-right">
          <h1>Oops...!<br/>UR Elderly User</h1>
          <p>Click Here to Login</p>
          <button type="button" className="btn login-btn" onClick={handleToggleToElderly}>
            Elderly User
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

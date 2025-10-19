import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../utils/api';
import { FaUser, FaLock, FaPhone } from 'react-icons/fa';
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
      {/* Elderly User Login Form */}
      <div className="form-box login">
        <form onSubmit={handleSubmit}>
          <h1>Hello Elderly User</h1>
          <p className="subtitle">Enter caregiver details to setup or login</p>
          
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

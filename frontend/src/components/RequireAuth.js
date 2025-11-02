import React from 'react';
import { Navigate } from 'react-router-dom';

const RequireAuth = ({ children, role }) => {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user.role) {
      return <Navigate to="/login" replace />;
    }

    if (user.role !== role) {
      return <Navigate to={`/${user.role}-dashboard`} replace />;
    }

    return children;
  } catch (error) {
    console.error('Auth check error:', error);
    return <Navigate to="/login" replace />;
  }
};

export default RequireAuth;
import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

export const ProtectedRoute = ({ 
  element: Element,
  requiredRole = null, // 'elderly' or 'caregiver' or null for any authenticated user
}) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let user;
  
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return <Navigate to="/login" replace />;
  }

  // Not authenticated
  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  // Role check if required
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate dashboard based on actual role
    return <Navigate to={`/${user.role}-dashboard`} replace />;
  }

  // Render the protected component
  return Element;
};
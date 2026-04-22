import React, { JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface PublicRouteProps {
  children: JSX.Element;
}

// Redirect already authenticated users to homepage
// Used to prevent logged-in users from accessing /login again
const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? <Navigate to="/" replace /> : children;
};

export default PublicRoute;
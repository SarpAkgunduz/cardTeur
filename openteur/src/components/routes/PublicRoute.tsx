import React, { JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { isLoggedIn } from '../../services/AuthService';

interface PublicRouteProps {
  children: JSX.Element;
}

// Redirect already authenticated users to homepage
// Used to prevent logged-in users from accessing /login again
const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  return isLoggedIn() ? <Navigate to="/" replace /> : children;
};

export default PublicRoute;
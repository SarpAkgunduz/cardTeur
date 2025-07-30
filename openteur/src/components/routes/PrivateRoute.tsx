import React, { JSX } from 'react';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  isAuthenticated: boolean;
  children: JSX.Element;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ isAuthenticated, children }) => {
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;

import React, { JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { isLoggedIn } from '../../services/AuthService';

interface PrivateRouteProps {
  children: JSX.Element;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;

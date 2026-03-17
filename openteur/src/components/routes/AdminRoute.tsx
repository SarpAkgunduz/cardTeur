// AdminRoute.tsx
import { Navigate } from 'react-router-dom';
import { isLoggedIn, getSession } from '../../services/AuthService';
import { JSX } from 'react';

interface AdminRouteProps {
  children: JSX.Element;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const session = getSession();
  
  // Redirect to login if not authenticated
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect non-admin users to homepage
  if (session?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default AdminRoute;
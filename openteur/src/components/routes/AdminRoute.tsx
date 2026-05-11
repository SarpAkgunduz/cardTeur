import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { JSX } from 'react';

interface AdminRouteProps {
  children?: JSX.Element;
}

const AdminRoute = (_props: AdminRouteProps) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Role-based routing not yet implemented — redirect non-admin to home
  return <Navigate to="/" replace />;
};

export default AdminRoute;
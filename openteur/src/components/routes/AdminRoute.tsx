// AdminRoute.tsx
import { Navigate } from 'react-router-dom';
import { isLoggedIn, getSession } from '../../services/AuthService';
import { JSX } from 'react';

interface AdminRouteProps {
  children: JSX.Element;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const session = getSession();
  
  // Önce login kontrolü
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  
  // Sonra admin kontrolü
  if (session?.role !== 'admin') {
    return <Navigate to="/" replace />; // Normal kullanıcıyı home'a gönder
  }
  
  return children;
};

export default AdminRoute;
import React, { JSX } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface PublicRouteProps {
  children: JSX.Element;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  if (currentUser) {
    const redirect = searchParams.get('redirect');
    return <Navigate to={redirect?.startsWith('/') ? redirect : '/'} replace />;
  }
  return children;
};

export default PublicRoute;
import React, { JSX } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface PublicRouteProps {
  children: JSX.Element;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  // A guest (anonymous) session still needs to reach /login and /signup —
  // that's exactly how they claim their account — so only a *real* signed-in
  // user gets bounced away from these pages.
  if (currentUser && !currentUser.isAnonymous) {
    const redirect = searchParams.get('redirect');
    return <Navigate to={redirect?.startsWith('/') ? redirect : '/'} replace />;
  }
  return children;
};

export default PublicRoute;
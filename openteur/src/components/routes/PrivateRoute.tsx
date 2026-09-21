import React, { JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import GuestLockedPage from '../GuestLockedPage';

interface PrivateRouteProps {
  children: JSX.Element;
  /**
   * Card building and match setup stay open to guests — this marks the
   * pages that don't: Crew, Friends, Schedule, Development, Profile, Voting.
   * A guest lands on GuestLockedPage instead of being redirected away, so
   * they can claim their account without losing the tab/context.
   */
  requireClaimed?: boolean;
  /** Translated feature name shown on the guest lock screen, e.g. t('nav.crew'). */
  featureName?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requireClaimed, featureName }) => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (requireClaimed && currentUser.isAnonymous) {
    return <GuestLockedPage featureName={featureName ?? t('common.other')} />;
  }
  return children;
};

export default PrivateRoute;

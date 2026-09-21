import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ClaimAccountModal from './ClaimAccountModal';
import './GuestLockedPage.css';

interface GuestLockedPageProps {
  /** Translated, human-readable name of the feature being gated (e.g. "Crews"). */
  featureName: string;
}

// Rendered in place of a protected page (Crew, Friends, Development Center,
// Profile, Schedule, Voting) when the current session is still a guest —
// card-building and match-setup stay open, but these need a real account.
const GuestLockedPage: React.FC<GuestLockedPageProps> = ({ featureName }) => {
  const [showModal, setShowModal] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="glp-wrap">
      <div className="glp-card">
        <div className="glp-icon">
          <i className="bi bi-lock-fill" />
        </div>
        <h2 className="glp-title">{t('guest.lockedTitle', { feature: featureName })}</h2>
        <p className="glp-text">{t('guest.lockedText')}</p>
        <button type="button" className="btn btn-ct glp-cta" onClick={() => setShowModal(true)}>
          <i className="bi bi-person-check-fill" />
          {t('guest.claimSaveCta')}
        </button>
      </div>

      {showModal && <ClaimAccountModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default GuestLockedPage;

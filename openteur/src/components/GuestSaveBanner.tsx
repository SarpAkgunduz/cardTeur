import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { usePlayers } from '../contexts/PlayerContext';
import ClaimAccountModal from './ClaimAccountModal';
import './GuestSaveBanner.css';

const dismissedKey = (uid: string) => `ct_guest_banner_dismissed_${uid}`;

// A quiet, dismissible strip that shows up once a guest has actually made
// something worth losing — their first card — rather than nagging before
// they've experienced any value.
const GuestSaveBanner: React.FC = () => {
  const { currentUser, isGuest } = useAuth();
  const { players } = usePlayers();
  const [dismissed, setDismissed] = useState(() => {
    if (!currentUser) return false;
    try {
      return localStorage.getItem(dismissedKey(currentUser.uid)) === '1';
    } catch {
      return false;
    }
  });
  const [showModal, setShowModal] = useState(false);
  const { t } = useTranslation();

  if (!isGuest || dismissed || players.length === 0) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      if (currentUser) localStorage.setItem(dismissedKey(currentUser.uid), '1');
    } catch {
      // best-effort
    }
  };

  return (
    <>
      <div className="gsb-bar">
        <i className="bi bi-shield-exclamation" />
        <span className="gsb-text">{t('guest.bannerText', { count: players.length })}</span>
        <button type="button" className="gsb-cta" onClick={() => setShowModal(true)}>
          {t('guest.claimSaveCta')}
        </button>
        <button type="button" className="gsb-dismiss" onClick={dismiss} aria-label={t('common.dismiss')}>
          <i className="bi bi-x" />
        </button>
      </div>
      {showModal && (
        <ClaimAccountModal
          onClose={() => setShowModal(false)}
          onClaimed={dismiss}
          titleKey="guest.bannerModalTitle"
          textKey="guest.claimText"
        />
      )}
    </>
  );
};

export default GuestSaveBanner;

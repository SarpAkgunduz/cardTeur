import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ClaimAccountModal from './ClaimAccountModal';

const SESSION_FLAG = 'ct_guest_exit_shown';
const TIMER_MS = 3 * 60 * 1000; // 3 minutes as a fallback if they never move toward the tab bar

// Classic exit-intent: the mouse leaving near the top of the viewport
// usually means "closing the tab" or "switching windows". Falls back to a
// flat timer so it still fires for touch/trackpad users who never trigger
// a mouseleave. Shown at most once per browser tab session.
const GuestExitIntentModal: React.FC = () => {
  const { isGuest } = useAuth();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isGuest) return;
    let alreadyShown = false;
    try {
      alreadyShown = sessionStorage.getItem(SESSION_FLAG) === '1';
    } catch {
      // ignore — worst case it can show more than once
    }
    if (alreadyShown) return;

    const trigger = () => {
      setShowModal(true);
      try {
        sessionStorage.setItem(SESSION_FLAG, '1');
      } catch {
        // best-effort
      }
    };

    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) trigger();
    };

    document.addEventListener('mouseleave', onMouseLeave);
    const timer = setTimeout(trigger, TIMER_MS);

    return () => {
      document.removeEventListener('mouseleave', onMouseLeave);
      clearTimeout(timer);
    };
  }, [isGuest]);

  if (!isGuest || !showModal) return null;

  return (
    <ClaimAccountModal
      onClose={() => setShowModal(false)}
      titleKey="guest.exitModalTitle"
      textKey="guest.exitModalText"
    />
  );
};

export default GuestExitIntentModal;

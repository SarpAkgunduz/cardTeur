import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { usePlayers } from '../contexts/PlayerContext';
import { useAuth } from '../contexts/AuthContext';
import ClaimAccountModal from './ClaimAccountModal';

const TIMER_MS = 3 * 60 * 1000; // 3-minute fallback for a guest who never backgrounds the app

// Mobile has no mouse to read "exit intent" from, so this mirrors the same
// idea with what mobile actually has: the app going to the background
// (the closest signal to "the person is leaving"), with a flat timer as a
// fallback. Shown at most once per app session, and only once the guest
// has actually created something worth losing.
export default function GuestReminderModal() {
  const { isGuest } = useAuth();
  const { players } = usePlayers();
  const [showModal, setShowModal] = useState(false);
  const shownRef = useRef(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!isGuest || players.length === 0 || shownRef.current) return;

    const trigger = () => {
      if (shownRef.current) return;
      shownRef.current = true;
      setShowModal(true);
    };

    const onChange = (next: AppStateStatus) => {
      if (appState.current === 'active' && next.match(/inactive|background/)) {
        trigger();
      }
      appState.current = next;
    };

    const sub = AppState.addEventListener('change', onChange);
    const timer = setTimeout(trigger, TIMER_MS);

    return () => {
      sub.remove();
      clearTimeout(timer);
    };
  }, [isGuest, players.length]);

  if (!isGuest || !showModal) return null;

  return (
    <ClaimAccountModal
      visible={showModal}
      onClose={() => setShowModal(false)}
      titleKey="guest.exitModalTitle"
      textKey="guest.exitModalText"
    />
  );
}

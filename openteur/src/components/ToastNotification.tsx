import React, { useEffect } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { playSound, type SoundName } from '../utils/sounds';

interface ToastNotificationProps {
  show: boolean;
  message: string;
  onClose: () => void;
  variant?: 'success' | 'danger' | 'warning' | 'info';
  // Lets a call site play a more specific sound than the generic
  // success/error chime (e.g. 'achievement' for a card reveal, 'badge'
  // for a crew addition) — this is the single place a toast's sound is
  // triggered, so a page never has to also call playSound() itself and
  // risk two sounds firing together. Pass 'none' to suppress sound.
  sound?: SoundName | 'none';
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ show, message, onClose, variant = 'success', sound }) => {
  useEffect(() => {
    if (!show) return;
    if (sound === 'none') return;
    const soundToPlay = sound ?? (variant === 'danger' ? 'error' : variant === 'success' ? 'success' : null);
    if (soundToPlay) playSound(soundToPlay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  return (
    <ToastContainer position="bottom-end" className="p-3" style={{ position: 'fixed', bottom: 0, right: 0, zIndex: 9999 }}>
      <Toast onClose={onClose} show={show} delay={5000} autohide={true} bg={variant}>
        <Toast.Body>{message}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
};

export default ToastNotification;

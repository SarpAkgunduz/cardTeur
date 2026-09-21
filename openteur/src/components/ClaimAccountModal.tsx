import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../services/api/apiClient';
import './ClaimAccountModal.css';

interface ClaimAccountModalProps {
  onClose: () => void;
  onClaimed?: () => void;
  /** Overrides the default "save your progress" copy for context (e.g. locked page, pricing). */
  titleKey?: string;
  textKey?: string;
}

// The single form used everywhere a guest (anonymous) session is asked to
// become a real account: it "claims" the session in place — same uid, same
// cards/matches already made — rather than creating a second, empty account.
const ClaimAccountModal: React.FC<ClaimAccountModalProps> = ({ onClose, onClaimed, titleKey, textKey }) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signUp, signInWithGoogle, refreshProfile } = useAuth();
  const { t } = useTranslation();

  const finishClaim = async () => {
    await refreshProfile();
    onClaimed?.();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing: string[] = [];
    if (!displayName) missing.push(t('common.name'));
    if (!email) missing.push(t('common.email'));
    if (!password) missing.push(t('common.password'));
    if (!confirmPassword) missing.push(t('auth.confirmPassword'));
    if (missing.length > 0) {
      setError(t('auth.fillFields', { fields: missing.join(', ') }));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await signUp(email, password);
      await apiRequest('/users/register', {
        method: 'POST',
        body: JSON.stringify({ displayName }),
      });
      await finishClaim();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/email-already-in-use' || code === 'auth/credential-already-in-use') {
        setError(t('guest.claimEmailInUse'));
      } else if (code === 'auth/weak-password') {
        setError(t('auth.weakPassword'));
      } else {
        setError(t('auth.signupFailed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const { user } = await signInWithGoogle();
      await apiRequest('/users/register', {
        method: 'POST',
        body: JSON.stringify({
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL || '',
        }),
      });
      await finishClaim();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user') {
        // no error — user just closed the popup
      } else if (code === 'auth/credential-already-in-use') {
        setError(t('guest.claimEmailInUse'));
      } else {
        setError(t('auth.googleFailed'));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="cam-backdrop" onClick={onClose}>
      <div className="cam-panel" role="dialog" aria-modal="true" aria-labelledby="cam-title" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="cam-close" onClick={onClose} aria-label={t('common.close')}>
          <i className="bi bi-x-lg" />
        </button>

        <div className="cam-header">
          <i className="bi bi-shield-check" />
          <h3 id="cam-title">{titleKey ? t(titleKey) : t('guest.claimTitle')}</h3>
        </div>
        <p className="cam-subtitle">{textKey ? t(textKey) : t('guest.claimText')}</p>

        <form onSubmit={handleSubmit} noValidate>
          {error && <div className="cam-error">{error}</div>}
          <div className="cam-field">
            <input
              type="text"
              className="cam-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('common.name')}
            />
          </div>
          <div className="cam-field">
            <input
              type="email"
              className="cam-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('common.email')}
            />
          </div>
          <div className="cam-field">
            <input
              type="password"
              className="cam-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('common.password')}
            />
          </div>
          <div className="cam-field">
            <input
              type="password"
              className="cam-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('auth.confirmPassword')}
            />
          </div>
          <button className="cam-submit-btn" type="submit" disabled={submitting}>
            {submitting ? t('auth.signingUp') : t('guest.claimSaveCta')}
          </button>
        </form>

        <div className="cam-divider"><span>{t('common.or')}</span></div>

        <button type="button" className="cam-google-btn" onClick={handleGoogle} disabled={googleLoading}>
          {!googleLoading && (
            <svg className="cam-google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          {googleLoading ? t('auth.googleLoading') : t('auth.googleBtn')}
        </button>

        <p className="cam-footnote">
          <Trans i18nKey="guest.claimFootnote" components={{ b: <strong /> }} />
        </p>
      </div>
    </div>
  );
};

export default ClaimAccountModal;

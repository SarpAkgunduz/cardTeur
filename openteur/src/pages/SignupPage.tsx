import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTutorial } from '../contexts/TutorialContext';
import { apiRequest } from '../services/api/apiClient';
import GoogleSignInButton from '../components/GoogleSignInButton';
import './SignupPage.css';

const SignupPage = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp } = useAuth();
  const { startTutorial } = useTutorial();
  const { t } = useTranslation();

  // Capture a referral link's ?ref=CODE so PricingPage can apply it later —
  // signup can bounce through Firebase/Google auth, so localStorage is used
  // instead of carrying the param through every redirect.
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      localStorage.setItem('ct_referral_code', ref);
    }
  }, [searchParams]);

  const handleSignup = async (e: React.FormEvent) => {
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

    setIsSubmitting(true);
    setError('');

    try {
      await signUp(email, password);
      startTutorial();
      // Persist user info in MongoDB after Firebase account creation
      await apiRequest('/users/register', {
        method: 'POST',
        body: JSON.stringify({ displayName }),
      });
      const redirect = searchParams.get('redirect');
      // If the redirect is an invite link, send the friend request while the token is fresh
      const inviteMatch = redirect?.match(/^\/invite\/(.+)$/);
      let redirectTo = redirect || '/';
      if (inviteMatch) {
        const inviterUid = inviteMatch[1];
        try {
          await apiRequest(`/users/friends/${inviterUid}`, { method: 'POST' });
        } catch {
          // Already friends/requested or user not found — non-fatal
        }
        redirectTo = '/friends';
      }
      // Route through /welcome first so the Google Ads sign-up conversion only
      // fires for a real, freshly-created account — never on a direct URL visit.
      navigate('/welcome', { state: { verifiedSignup: true, redirectTo } });
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        setError(t('auth.emailInUse'));
      } else if (err?.code === 'auth/weak-password') {
        setError(t('auth.weakPassword'));
      } else {
        setError(t('auth.signupFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ct-signup-wrap">
      <div className="ct-signup-box">
        <div className="ct-signup-title"><Trans i18nKey="auth.signupTitle" components={{ accent: <span /> }} /></div>
        <p className="ct-signup-sub">{t('auth.signupSub')}</p>
        <form onSubmit={handleSignup}>
          {error && <div className="ct-signup-error">{error}</div>}
          <div className="ct-signup-field">
            <label className="ct-signup-label">{t('common.name')} <span className="ct-signup-required">*</span></label>
            <input
              type="text"
              className="ct-signup-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div className="ct-signup-field">
            <label className="ct-signup-label">{t('common.email')} <span className="ct-signup-required">*</span></label>
            <input
              type="email"
              className="ct-signup-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>
          <div className="ct-signup-field">
            <label className="ct-signup-label">{t('common.password')} <span className="ct-signup-required">*</span></label>
            <input
              type="password"
              className="ct-signup-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="ct-signup-field">
            <label className="ct-signup-label">{t('auth.confirmPassword')} <span className="ct-signup-required">*</span></label>
            <input
              type="password"
              className="ct-signup-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button className="ct-signup-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('auth.signingUp') : t('auth.signupBtn')}
          </button>
        </form>
        <div className="ct-google-divider"><span>{t('common.or')}</span></div>
        <GoogleSignInButton />
        <p className="ct-signup-login-link">
          {t('auth.haveAccount')}{' '}
          <span onClick={() => navigate(`/login${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : ''}`)}>{t('nav.login')}</span>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';
import './LoginPage.css';
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, resetPassword } = useAuth();
  const { t } = useTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError(t('auth.fillFields', { fields: [t('common.email'), t('common.password')].join(', ') }));
      return;
    }

    setIsSubmitting(true);
    setError('');
    setNotice('');
    try {
      await signIn(email, password);
      // PublicRoute handles redirect once Firebase auth state propagates to context
    } catch {
      setError(t('auth.loginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setNotice('');
      setError(t('auth.resetNeedsEmail'));
      return;
    }
    setIsResetting(true);
    setError('');
    setNotice('');
    try {
      await resetPassword(email);
      setNotice(t('auth.resetSent', { email }));
    } catch {
      setError(t('auth.resetFailed'));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="ct-login-wrap">
      <div className="ct-login-box">
        <div className="ct-login-title"><Trans i18nKey="auth.loginTitle" components={{ accent: <span /> }} /></div>
        <p className="ct-login-sub">{t('auth.loginSub')}</p>
        <form onSubmit={handleLogin}>
          {error && <div className="ct-login-error">{error}</div>}
          {notice && <div className="ct-login-notice">{notice}</div>}
          <div className="ct-login-field">
            <label className="ct-login-label">{t('common.email')}</label>
            <input
              type="email"
              className="ct-login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>
          <div className="ct-login-field">
            <label className="ct-login-label">{t('common.password')}</label>
            <input
              type="password"
              className="ct-login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button className="ct-login-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('auth.loggingIn') : t('auth.loginBtn')}
          </button>
          <button
            type="button"
            className="ct-login-forgot"
            onClick={handleResetPassword}
            disabled={isResetting}
          >
            {t('auth.forgotPassword')}
          </button>
        </form>
        <div className="ct-google-divider"><span>{t('common.or')}</span></div>
        <GoogleSignInButton />
        <p className="ct-login-signup-link">
          {t('auth.noAccount')}{' '}
          <span onClick={() => navigate(`/signup${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : ''}`)}>{t('nav.signup')}</span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

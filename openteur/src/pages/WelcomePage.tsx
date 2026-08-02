import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './ThankYouPage.css';

interface WelcomeState {
  verifiedSignup?: boolean;
  redirectTo?: string;
}

const WelcomePage = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isTR = (i18n.resolvedLanguage || i18n.language || '').startsWith('tr');

  // Only a real post-signup redirect carries this router state (see SignupPage's
  // navigate('/welcome', { state: { verifiedSignup: true, redirectTo } })). A direct
  // visit to /welcome has no state, so the conversion event below never fires for it.
  useEffect(() => {
    const state = (location.state || {}) as WelcomeState;
    const redirectTo = state.redirectTo || '/';

    if (state.verifiedSignup) {
      // Google Ads sign-up conversion snippet goes here once a conversion ID exists —
      // e.g. gtag('event', 'conversion', { send_to: 'AW-XXXXXXXXX/XXXXXXXXXXX' }).
      console.log('[welcome] verified post-signup landing — ready for conversion tracking');
    }

    const timer = setTimeout(() => {
      navigate(redirectTo, { replace: true });
    }, 900);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="content-card thank-you">
          <div className="thank-you__check">
            <i className="bi bi-stars"></i>
          </div>

          <h2 className="page-title thank-you__title">
            {isTR ? 'Aramıza hoş geldin!' : 'Welcome aboard!'}
          </h2>

          <p className="thank-you__message">
            {isTR
              ? 'Hesabın oluşturuldu, seni panele yönlendiriyoruz…'
              : 'Your account is ready, taking you to your dashboard…'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CHECKOUT_COMPLETED_FLAG } from '../services/paddle';
import './ThankYouPage.css';

const ThankYouPage = () => {
  const { i18n } = useTranslation();
  const isTR = (i18n.resolvedLanguage || i18n.language || '').startsWith('tr');

  // Only a real post-checkout landing sets this flag (see paddle.ts eventCallback).
  // Read it once, then remove it immediately so refreshing or revisiting this URL
  // directly never re-fires (or fires) the ad conversion below.
  useEffect(() => {
    const verifiedPurchase = sessionStorage.getItem(CHECKOUT_COMPLETED_FLAG) === '1';
    if (verifiedPurchase) {
      sessionStorage.removeItem(CHECKOUT_COMPLETED_FLAG);
      // Google Ads conversion snippet goes here once a conversion ID exists —
      // e.g. gtag('event', 'conversion', { send_to: 'AW-XXXXXXXXX/XXXXXXXXXXX' }).
      // This branch only runs for a verified post-checkout landing.
      console.log('[thank-you] verified checkout landing — ready for conversion tracking');
    }
  }, []);

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="content-card thank-you">
          <div className="thank-you__check">
            <i className="bi bi-check-circle-fill"></i>
          </div>

          <h2 className="page-title thank-you__title">
            {isTR ? 'Teşekkürler!' : 'Thank You!'}
          </h2>

          <p className="thank-you__message">
            {isTR
              ? 'Ödemeniz alındı. Abonelik durumunuz kısa süre içinde hesabınıza yansıyacak.'
              : 'Your payment was received. Your subscription will be reflected on your account shortly.'}
          </p>

          <div className="thank-you__actions">
            <Link to="/manage" className="btn btn-ct">
              {isTR ? 'Panele Dön' : 'Go to Dashboard'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;

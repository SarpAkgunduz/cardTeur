import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './ThankYouPage.css';

const ThankYouPage = () => {
  const { i18n } = useTranslation();
  const isTR = (i18n.resolvedLanguage || i18n.language || '').startsWith('tr');

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

/*
 * Google Ads conversion tracking placeholder.
 * Once a conversion action + ID exist in Google Ads, paste the generated
 * gtag event snippet here (or load it via a <script> in index.html and fire
 * gtag('event', 'conversion', { send_to: 'AW-XXXXXXXXX/XXXXXXXXXXX' }) in a
 * useEffect on mount). Left out for now — no conversion ID configured yet.
 */

export default ThankYouPage;

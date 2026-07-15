import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './AppFooter.css';

const TICKER_ITEMS = [

  { label: 'CARDTEUR', value: 'v1.0' },
];

const LEGAL_LINKS = [
  { labelKey: 'footer.terms', path: '/terms' },
  { labelKey: 'footer.privacy', path: '/privacy' },
  { labelKey: 'footer.refunds', path: '/refunds' },
  { labelKey: 'footer.support', path: '/support' },
];

const AppFooter = () => {
  const { t } = useTranslation();

  return (
    <footer className="ct-footer">
      <div className="ct-footer__status">
        {TICKER_ITEMS.map((item) => (
          <div className="ct-footer__item" key={item.label}>
            <span className="ct-footer__label">{item.label}:</span>
            <span className="ct-footer__value">{item.value}</span>
          </div>
        ))}
      </div>
      <div className="ct-footer__legal">
        {LEGAL_LINKS.map((item) => (
          <Link className="ct-footer__link" to={item.path} key={item.path}>
            {t(item.labelKey)}
          </Link>
        ))}
      </div>
    </footer>
  );
};

export default AppFooter;

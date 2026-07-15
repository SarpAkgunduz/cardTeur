import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import BackButton from '../components/BackButton';
import './LegalPage.css';
import './SupportPage.css';

const SUPPORT_EMAIL = 'support@cardteur.com';

const FAQ_KEYS = Array.from({ length: 12 }, (_, i) => i + 1);

const SupportPage = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="content-card">
          <div className="page-header">
            <div className="back-button-container">
              <BackButton fallback="/" position="static" />
            </div>
            <h2 className="page-title">{t('support.title')}</h2>
          </div>

          <div className="legal-page">
            <p className="legal-page__intro">{t('support.intro')}</p>

            <div className="legal-page__section support-contact">
              <h3>{t('support.contactHeading')}</h3>
              <p>{t('support.contactText')}</p>
              <a className="support-contact__button" href={`mailto:${SUPPORT_EMAIL}`}>
                <i className="bi bi-envelope-fill" style={{ marginRight: 8 }}></i>
                {t('support.emailButton')}
              </a>
            </div>

            <div className="legal-page__section">
              <h3>{t('support.faqHeading')}</h3>
              <div className="faq-list">
                {FAQ_KEYS.map((n) => {
                  const isOpen = openIndex === n;
                  return (
                    <div key={n} className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}>
                      <button
                        type="button"
                        className="faq-item__question"
                        onClick={() => setOpenIndex(isOpen ? null : n)}
                        aria-expanded={isOpen}
                      >
                        <span>{t(`support.q${n}`)}</span>
                        <i className={`bi ${isOpen ? 'bi-dash-lg' : 'bi-plus-lg'} faq-item__icon`}></i>
                      </button>
                      {isOpen && <p className="faq-item__answer">{t(`support.a${n}`)}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;

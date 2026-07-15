import { useTranslation } from 'react-i18next';
import BackButton from '../components/BackButton';
import './DevelopmentPage.css';

const DevelopmentPage = () => {
  const { t } = useTranslation();

  const features = [
    { icon: 'bi-people-fill', key: 'feature1' },
    { icon: 'bi-calendar-week', key: 'feature2' },
    { icon: 'bi-graph-up-arrow', key: 'feature3' },
    { icon: 'bi-mortarboard-fill', key: 'feature4' },
  ];

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="content-card development-page">
          <div className="page-header">
            <div className="back-button-container">
              <BackButton position="static" />
            </div>
            <h2 className="page-title">{t('development.title')}</h2>
          </div>

          <div className="development-hero">
            <span className="development-badge">{t('development.comingSoon')}</span>
            <p className="development-intro">{t('development.intro')}</p>
          </div>

          <div className="development-features">
            {features.map((f) => (
              <div className="development-feature" key={f.key}>
                <i className={`bi ${f.icon}`} />
                <div>
                  <h3>{t(`development.${f.key}Title`)}</h3>
                  <p>{t(`development.${f.key}Body`)}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="development-note">{t('development.note')}</p>
        </div>
      </div>
    </div>
  );
};

export default DevelopmentPage;

import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="content-card">
          <div className="welcome">
            <div>
              <h1 className="welcome-title">
                <Trans i18nKey="home.title" components={{ accent: <span /> }} />
              </h1>
            </div>
          </div>
          <div className="home-grid" data-tutorial="home-grid">
            <button className="btn-homepage" onClick={() => navigate('/manage')}>
              <i className="bi bi-person-fill-gear btn-icon"></i>
              <span className="btn-label">{t('home.manageSquad')}</span>
            </button>
            <button className="btn-homepage" onClick={() => navigate('/preview')}>
              <i className="bi bi-person-lines-fill btn-icon"></i>
              <span className="btn-label">{t('home.previewPlayer')}</span>
            </button>
            <button className="btn-homepage" onClick={() => navigate('/match')}>
              <i className="bi bi-clipboard-x-fill btn-icon"></i>
              <span className="btn-label">{t('home.prepareMatch')}</span>
            </button>
            <button className="btn-homepage" onClick={() => navigate('/schedule')}>
              <i className="bi bi-calendar-event-fill btn-icon"></i>
              <span className="btn-label">{t('home.schedule')}</span>
            </button>
            <button className="btn-homepage" onClick={() => navigate('/crew')}>
              <i className="bi bi-people-fill btn-icon"></i>
              <span className="btn-label">{t('home.myCrew')}</span>
            </button>
            <button className="btn-homepage" onClick={() => navigate('/friends')}>
              <i className="bi bi-person-heart btn-icon"></i>
              <span className="btn-label">{t('home.friends')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

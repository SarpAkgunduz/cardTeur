import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="content-card">
          <div className="welcome">
            <div>
              <h1 className="welcome-title">Your <span>Cardteur</span> League</h1>
            </div>
          </div>
          <div className="home-grid">
            <button className="btn-homepage" onClick={() => navigate('/manage')}>
              <i className="bi bi-person-fill-gear btn-icon"></i>
              <span className="btn-label">Manage Squad</span>
            </button>
            <button className="btn-homepage" onClick={() => navigate('/preview')}>
              <i className="bi bi-person-lines-fill btn-icon"></i>
              <span className="btn-label">Preview Player</span>
            </button>
            <button className="btn-homepage" onClick={() => navigate('/match')}>
              <i className="bi bi-clipboard-x-fill btn-icon"></i>
              <span className="btn-label">Prepare Match</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

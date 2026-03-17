import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="content-card">
          <div className="welcome mb-5">
            <h1 className="welcome-title">Your Cardteur League</h1>
          </div>
          <div className="row">
            <div className="col-sm d-grid mb-3">
              <button
                className="btn btn-lg btn-homepage btn-home"
                onClick={() => navigate('/manage')}
              >
                <i className="bi bi-person-fill-gear btn-icon"></i>
                <span className="btn-label">Manage Squad</span>
              </button>
            </div>
            <div className="col-sm d-grid mb-3">
              <button
                className="btn btn-lg btn-homepage btn-home"
                onClick={() => navigate('/preview')}
              >
                <i className="bi bi-person-lines-fill btn-icon"></i>
                <span className="btn-label">Preview Player</span>
              </button>
            </div>
            <div className="col-sm d-grid mb-3">
              <button
                className="btn btn-lg btn-homepage btn-home"
                onClick={() => navigate('/match')}
              >
                <i className="bi bi-clipboard-x-fill btn-icon"></i>
                <span className="btn-label">Prepare Match</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

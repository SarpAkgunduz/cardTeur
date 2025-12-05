import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="content-card" style={{ display: 'block' }}>
          <div className="welcome mb-5"></div>
          <div className="row">
            <div className="col-sm d-grid mb-3">
              <button
                className="btn btn-lg btn-homepage btn-player-edit btn-home"
                onClick={() => navigate('/edit')}
              ></button>
            </div>
            <div className="col-sm d-grid mb-3">
              <button
                className="btn btn-lg btn-homepage btn-player-preview btn-home"
                onClick={() => navigate('/preview')}
              ></button>
            </div>
            <div className="col-sm d-grid mb-3">
              <button
                className="btn btn-lg btn-homepage btn-prepare-match btn-home"
                onClick={() => navigate('/match')}
              ></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

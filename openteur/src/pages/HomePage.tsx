import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { isLoggedIn } from '../services/AuthService';
const HomePage = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
    }
  }, [navigate]);
  return (
    <div className="row">
      <div className="container col-9 mt-5 body">
        <div className="welcome mb-5"></div>
        <div className="row ">
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
  );
};

export default HomePage;

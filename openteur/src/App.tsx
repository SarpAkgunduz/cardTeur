import LoginPage from './pages/LoginPage';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import PlayersPage from './pages/PlayersPage';
import PreviewPage from './pages/PreviewPage';
import MatchPage from './pages/MatchPage';
import AddPlayerForm from './pages/AddPlayerForm';
import './App.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="row">

      <div className="container col-9 mt-5 body">
        <div className="welcome mb-5"></div>
        <div className="row ">
          <div className="col-sm d-grid mb-3">
            <button className="btn btn-lg btn-homepage btn-player-edit btn-home" onClick={() => navigate('/edit')}></button>
          </div>
          <div className="col-sm d-grid mb-3">
            <button className="btn btn-lg btn-homepage btn-player-preview btn-home" onClick={() => navigate('/preview')}></button>
          </div>
          <div className="col-sm d-grid mb-3">
            <button className="btn btn-lg btn-homepage btn-prepare-match btn-home" onClick={() => navigate('/match')}></button>
          </div>
        </div>
      </div>

    </div>
  );
};


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/edit" element={<PlayersPage />} />
        <Route path="/preview" element={<PreviewPage />} />
        <Route path="/match" element={<MatchPage />} />
        <Route path="/add" element={<AddPlayerForm />} />
      </Routes>
    </Router>
  );
};

export default App;

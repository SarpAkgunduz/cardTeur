import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import PlayersPage from './pages/PlayersPage';
import PreviewPage from './pages/PreviewPage';
import MatchPage from './pages/MatchPage';
import AddPlayerForm from './pages/AddPlayerForm';


const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-5">Welcome to Cardteur</h1>
      <div className="row justify-content-center">
        <div className="col-md-3 d-grid mx-2 mb-3">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/edit')}>
            Edit Players
          </button>
        </div>
        <div className="col-md-3 d-grid mx-2 mb-3">
          <button className="btn btn-success btn-lg" onClick={() => navigate('/preview')}>
            Preview Cards
          </button>
        </div>
        <div className="col-md-3 d-grid mx-2 mb-3">
          <button className="btn btn-warning btn-lg" onClick={() => navigate('/match')}>
            Prepare Match
          </button>
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
        <Route path="/edit" element={<PlayersPage />} />
        <Route path="/preview" element={<PreviewPage />} />
        <Route path="/match" element={<MatchPage />} />
        <Route path="/add" element={<AddPlayerForm />} />
      </Routes>
    </Router>
  );
};

export default App;

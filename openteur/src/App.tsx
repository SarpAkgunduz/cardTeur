import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import PlayersPage from './pages/PlayersPage';
import PreviewPage from './pages/PreviewPage';
import CrewPage from './pages/CrewPage';
import MatchPage from './pages/MatchPage';
import AddPlayerForm from './pages/AddPlayerForm';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import PrivateRoute from './components/routes/PrivateRoute';
import PublicRoute from './components/routes/PublicRoute';
import Navbar from './components/Navbar';

const App = () => {
  return (
    <Router>
      <div className="ct-app-shell">
        <Navbar />
        <div className="ct-app-content">
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/" element={<HomePage />} />
        <Route
          path="/manage"
          element={
            <PrivateRoute>
              <PlayersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/preview"
          element={
            <PrivateRoute>
              <PreviewPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/crew"
          element={
            <PrivateRoute>
              <CrewPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/match"
          element={
            <PrivateRoute>
              <MatchPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/add"
          element={
            <PrivateRoute>
              <AddPlayerForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/edit-player/:id"
          element={
            <PrivateRoute>
              <AddPlayerForm />
            </PrivateRoute>
          }
        />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;

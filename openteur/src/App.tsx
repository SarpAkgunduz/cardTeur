import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import PlayersPage from './pages/PlayersPage';
import PreviewPage from './pages/PreviewPage';
import MatchPage from './pages/MatchPage';
import AddPlayerForm from './pages/AddPlayerForm';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import PrivateRoute from './components/routes/PrivateRoute';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HomePage />} />
        <Route
          path="/edit"
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
    </Router>
  );
};

export default App;

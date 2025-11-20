import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';

import PlayersPage from './pages/PlayersPage';
import PreviewPage from './pages/PreviewPage';
import MatchPage from './pages/MatchPage';
import AddPlayerForm from './pages/AddPlayerForm';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import PrivateRoute from './components/routes/PrivateRoute';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={<LoginPage onLogin={() => setIsAuthenticated(true)} />}
        />
        <Route path="/edit" element={<PlayersPage />} />
        <Route path="/preview" element={<PreviewPage />} />
        <Route path="/match" element={<MatchPage />} />
        <Route
          path="/add"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <AddPlayerForm />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PlayerProvider } from './contexts/PlayerContext';
import { TutorialProvider } from './contexts/TutorialContext';
import './App.css';

import PlayersPage from './pages/PlayersPage';
import PreviewPage from './pages/PreviewPage';
import CrewPage from './pages/CrewPage';
import MatchPage from './pages/MatchPage';
import SchedulePage from './pages/SchedulePage';
import AddPlayerForm from './pages/AddPlayerForm';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import FriendsPage from './pages/FriendsPage';
import InvitePage from './pages/InvitePage';
import PricingPage from './pages/PricingPage';
import ReferralsPage from './pages/ReferralsPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import RefundPolicyPage from './pages/RefundPolicyPage';
import ThankYouPage from './pages/ThankYouPage';
import PrivateRoute from './components/routes/PrivateRoute';
import PublicRoute from './components/routes/PublicRoute';
import Navbar from './components/Navbar';
import AppFooter from './components/AppFooter';
import TutorialOverlay from './components/tutorial/TutorialOverlay';

const HomeRoute = () => {
  const { currentUser } = useAuth();
  return currentUser ? <HomePage /> : <LandingPage />;
};

const App = () => {
  return (
    <AuthProvider>
    <Router>
      <PlayerProvider>
      <TutorialProvider>
      <div className="ct-app-shell">
        <Navbar />
        <div className="ct-app-content">
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
            <Route path="/" element={<HomeRoute />} />
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
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <PrivateRoute>
              <FriendsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <PrivateRoute>
              <SchedulePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/pricing"
          element={
            <PrivateRoute>
              <PricingPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/referrals"
          element={
            <PrivateRoute>
              <ReferralsPage />
            </PrivateRoute>
          }
        />
        <Route path="/invite/:inviterUid" element={<InvitePage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/refunds" element={<RefundPolicyPage />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
          </Routes>
        </div>
        <AppFooter />
        <TutorialOverlay />
      </div>
      </TutorialProvider>
      </PlayerProvider>
    </Router>
    </AuthProvider>
  );
};

export default App;

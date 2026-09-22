import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PlayerProvider } from './contexts/PlayerContext';
import { TutorialProvider } from './contexts/TutorialContext';
import './App.css';

import PlayersPage from './pages/PlayersPage';
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
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import RefundPolicyPage from './pages/RefundPolicyPage';
import SupportPage from './pages/SupportPage';
import ThankYouPage from './pages/ThankYouPage';
import WelcomePage from './pages/WelcomePage';
import DevelopmentPage from './pages/DevelopmentPage';
import VotingPage from './pages/VotingPage';
import PrivateRoute from './components/routes/PrivateRoute';
import PublicRoute from './components/routes/PublicRoute';
import Navbar from './components/Navbar';
import AppFooter from './components/AppFooter';
import TutorialOverlay from './components/tutorial/TutorialOverlay';
import GuestSaveBanner from './components/GuestSaveBanner';

const HomeRoute = () => {
  const { currentUser } = useAuth();
  return currentUser ? <HomePage /> : <LandingPage />;
};

const AppRoutes = () => {
  const { t } = useTranslation();
  return (
      <div className="ct-app-shell">
        <Navbar />
        <GuestSaveBanner />
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
          path="/crew"
          element={
            <PrivateRoute requireClaimed featureName={t('nav.crew')}>
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
            <PrivateRoute requireClaimed featureName={t('nav.profile')}>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <PrivateRoute requireClaimed featureName={t('nav.friends')}>
              <FriendsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <PrivateRoute requireClaimed featureName={t('nav.schedule')}>
              <SchedulePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/voting/:sessionId"
          element={
            <PrivateRoute requireClaimed featureName={t('voting.title')}>
              <VotingPage />
            </PrivateRoute>
          }
        />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/invite/:inviterUid" element={<InvitePage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/refunds" element={<RefundPolicyPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route
          path="/development"
          element={
            <PrivateRoute requireClaimed featureName={t('nav.development')}>
              <DevelopmentPage />
            </PrivateRoute>
          }
        />
          </Routes>
        </div>
        <AppFooter />
        <TutorialOverlay />
      </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
    <Router>
      <PlayerProvider>
      <TutorialProvider>
        <AppRoutes />
      </TutorialProvider>
      </PlayerProvider>
    </Router>
    </AuthProvider>
  );
};

export default App;

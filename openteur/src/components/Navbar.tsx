import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTutorial } from '../contexts/TutorialContext';
import './Navbar.css';

const NAV_LINKS = [
  { path: '/manage', label: 'Roster' },
  { path: '/match', label: 'Match' },
  { path: '/schedule', label: 'Schedule' },
  { path: '/preview', label: 'Preview' },
  { path: '/crew', label: 'My Crew' },
  { path: '/friends', label: 'Friends' },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, signOut } = useAuth();
  const { startTutorial } = useTutorial();
  const loggedIn = !!currentUser;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);

  // Close help menu on outside click
  useEffect(() => {
    if (!helpOpen) return;
    const onClick = (e: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setHelpOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [helpOpen]);

  const isActive = (path: string) => location.pathname === path;

  // Close menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent background scroll while mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }
    return () => document.body.classList.remove('mobile-menu-open');
  }, [mobileOpen]);

  return (
    <>
      <nav className="ct-nav">
        <div className="ct-nav__left">
          <div className="ct-nav__logo" onClick={() => navigate('/')}>
            CardTeur
          </div>
          {loggedIn && (
            <div className="ct-nav__links">
              {NAV_LINKS.map(({ path, label }) => (
                <button
                  key={path}
                  className={`ct-nav__link ${isActive(path) ? 'ct-nav__link--active' : ''}`}
                  onClick={() => navigate(path)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ct-nav__right">
          {/* Desktop: user chip + logout / login + signup */}
          {loggedIn && (
            <div className="ct-nav__help" ref={helpRef}>
              <button
                className="ct-nav__help-btn"
                onClick={() => setHelpOpen(prev => !prev)}
                aria-label="Help"
                title="Help"
              >
                <i className="bi bi-question-lg" />
              </button>
              {helpOpen && (
                <div className="ct-nav__help-menu">
                  <button
                    className="ct-nav__help-item"
                    onClick={() => { setHelpOpen(false); startTutorial(); }}
                  >
                    <i className="bi bi-arrow-repeat" />
                    Replay tutorial
                  </button>
                </div>
              )}
            </div>
          )}
          {loggedIn ? (
            <div className="ct-nav__user-area">
              <button
                className={`ct-nav__user-chip ${isActive('/profile') ? 'ct-nav__user-chip--active' : ''}`}
                onClick={() => navigate('/profile')}
              >
                {currentUser?.displayName || currentUser?.email?.split('@')[0]}
              </button>
              <button className="ct-nav__logout" onClick={() => { signOut(); navigate('/login'); }}>
                Logout
              </button>
            </div>
          ) : (
            <div className="ct-nav__auth-btns">
              <button className="ct-nav__btn-login" onClick={() => navigate('/login')}>Login</button>
              <button className="ct-nav__btn-signup" onClick={() => navigate('/signup')}>Sign Up</button>
            </div>
          )}

          {/* Mobile: hamburger toggle */}
          <button
            className="ct-nav__hamburger"
            onClick={() => setMobileOpen(prev => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            <i className={`bi ${mobileOpen ? 'bi-x-lg' : 'bi-list'}`} />
          </button>
        </div>
      </nav>

      {/* Mobile overlay menu — rendered outside nav so it fills the viewport below it */}
      {mobileOpen && (
        <div className="ct-nav__mobile-menu">
          {loggedIn && (
            <nav className="ct-nav__mobile-links">
              {NAV_LINKS.map(({ path, label }) => (
                <button
                  key={path}
                  className={`ct-nav__mobile-link ${isActive(path) ? 'ct-nav__mobile-link--active' : ''}`}
                  onClick={() => navigate(path)}
                >
                  {label}
                </button>
              ))}
            </nav>
          )}

          <div className="ct-nav__mobile-footer">
            {loggedIn ? (
              <>
                <button
                  className={`ct-nav__mobile-link ${isActive('/profile') ? 'ct-nav__mobile-link--active' : ''}`}
                  onClick={() => navigate('/profile')}
                >
                  Profile
                </button>
                <button
                  className="ct-nav__mobile-logout"
                  onClick={() => { signOut(); navigate('/login'); }}
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="ct-nav__mobile-auth-btns">
                <button className="ct-nav__btn-login" onClick={() => navigate('/login')}>Login</button>
                <button className="ct-nav__btn-signup" onClick={() => navigate('/signup')}>Sign Up</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;

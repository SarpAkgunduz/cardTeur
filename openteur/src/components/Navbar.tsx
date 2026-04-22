import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, signOut } = useAuth();
  const loggedIn = !!currentUser;

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="ct-nav">
      <div className="ct-nav__left">
        <div className="ct-nav__logo" onClick={() => navigate('/')}>
          CardTeur
        </div>
        {loggedIn && (
          <div className="ct-nav__links">
            <button
              className={`ct-nav__link ${isActive('/manage') ? 'ct-nav__link--active' : ''}`}
              onClick={() => navigate('/manage')}
            >
              Roster
            </button>
            <button
              className={`ct-nav__link ${isActive('/match') ? 'ct-nav__link--active' : ''}`}
              onClick={() => navigate('/match')}
            >
              Match
            </button>
            <button
              className={`ct-nav__link ${isActive('/preview') ? 'ct-nav__link--active' : ''}`}
              onClick={() => navigate('/preview')}
            >
              Preview
            </button>
            <button
              className={`ct-nav__link ${isActive('/crew') ? 'ct-nav__link--active' : ''}`}
              onClick={() => navigate('/crew')}
            >
              My Crew
            </button>
          </div>
        )}
      </div>
      <div className="ct-nav__right">
        {loggedIn ? (
          <button className="ct-nav__logout" onClick={() => { signOut(); navigate('/login'); }}>
            Logout
          </button>
        ) : (
          <button className="ct-nav__logout" onClick={() => navigate('/login')}>
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

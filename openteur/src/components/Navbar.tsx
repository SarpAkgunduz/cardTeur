import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTutorial } from '../contexts/TutorialContext';
import { LANGUAGES } from '../i18n';
import './Navbar.css';

const NAV_LINKS = [
  { path: '/manage', labelKey: 'nav.roster' },
  { path: '/match', labelKey: 'nav.match' },
  { path: '/schedule', labelKey: 'nav.schedule' },
  { path: '/crew', labelKey: 'nav.crew' },
  { path: '/friends', labelKey: 'nav.friends' },
  { path: '/development', labelKey: 'nav.development' },
  { path: '/pricing', labelKey: 'nav.pricing' },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, signOut, plan } = useAuth();
  const isPremium = plan === 'premium' || plan === 'premium_plus';
  const { startTutorial } = useTutorial();
  const { t, i18n } = useTranslation();
  const loggedIn = !!currentUser;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // Close help/language menus on outside click
  useEffect(() => {
    if (!helpOpen && !langOpen) return;
    const onClick = (e: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setHelpOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [helpOpen, langOpen]);

  const currentLang = LANGUAGES.find(l => i18n.language?.startsWith(l.code)) ?? LANGUAGES[0];

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
          <div className="ct-nav__links">
            {(loggedIn ? NAV_LINKS : NAV_LINKS.filter(l => l.path === '/pricing')).map(({ path, labelKey }) => (
              <button
                key={path}
                className={`ct-nav__link ${isActive(path) ? 'ct-nav__link--active' : ''}`}
                onClick={() => navigate(path)}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="ct-nav__right">
          <div className="ct-nav__help ct-nav__lang" ref={langRef}>
            <button
              className="ct-nav__help-btn ct-nav__lang-btn"
              onClick={() => setLangOpen(prev => !prev)}
              aria-label={t('nav.language')}
              title={t('nav.language')}
            >
              {currentLang.code.toUpperCase()}
            </button>
            {langOpen && (
              <div className="ct-nav__help-menu ct-nav__lang-menu">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    className={`ct-nav__help-item ${currentLang.code === lang.code ? 'ct-nav__help-item--active' : ''}`}
                    onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false); }}
                  >
                    <span className="ct-nav__lang-code">{lang.code.toUpperCase()}</span>
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Desktop: user chip + logout / login + signup */}
          {loggedIn && (
            <div className="ct-nav__help" ref={helpRef}>
              <button
                className="ct-nav__help-btn"
                onClick={() => setHelpOpen(prev => !prev)}
                aria-label={t('nav.help')}
                title={t('nav.help')}
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
                    {t('nav.replayTutorial')}
                  </button>
                </div>
              )}
            </div>
          )}
          {loggedIn ? (
            <div className="ct-nav__user-area">
              {isPremium && (
                <span
                  className={`ct-nav__plan-badge ${plan === 'premium_plus' ? 'ct-nav__plan-badge--plus' : ''}`}
                  title={plan === 'premium_plus' ? t('pricing.premiumPlusName') : t('pricing.premiumName')}
                >
                  <i className="bi bi-gem" />
                  {plan === 'premium_plus' ? t('pricing.premiumPlusName') : t('pricing.premiumName')}
                </span>
              )}
              <button
                className={`ct-nav__user-chip ${isActive('/profile') ? 'ct-nav__user-chip--active' : ''}`}
                onClick={() => navigate('/profile')}
              >
                {currentUser?.displayName || currentUser?.email?.split('@')[0]}
              </button>
              <button className="ct-nav__logout" onClick={() => { signOut(); navigate('/login'); }}>
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <div className="ct-nav__auth-btns">
              <button className="ct-nav__btn-login" onClick={() => navigate('/login')}>{t('nav.login')}</button>
              <button className="ct-nav__btn-signup" onClick={() => navigate('/signup')}>{t('nav.signup')}</button>
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
              {NAV_LINKS.map(({ path, labelKey }) => (
                <button
                  key={path}
                  className={`ct-nav__mobile-link ${isActive(path) ? 'ct-nav__mobile-link--active' : ''}`}
                  onClick={() => navigate(path)}
                >
                  {t(labelKey)}
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
                  {t('nav.profile')}
                  {isPremium && (
                    <span className={`ct-nav__plan-badge ${plan === 'premium_plus' ? 'ct-nav__plan-badge--plus' : ''}`}>
                      <i className="bi bi-gem" />
                      {plan === 'premium_plus' ? t('pricing.premiumPlusName') : t('pricing.premiumName')}
                    </span>
                  )}
                </button>
                <button
                  className="ct-nav__mobile-logout"
                  onClick={() => { signOut(); navigate('/login'); }}
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <div className="ct-nav__mobile-auth-btns">
                <button className="ct-nav__btn-login" onClick={() => navigate('/login')}>{t('nav.login')}</button>
                <button className="ct-nav__btn-signup" onClick={() => navigate('/signup')}>{t('nav.signup')}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;

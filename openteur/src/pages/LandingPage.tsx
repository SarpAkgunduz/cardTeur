import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import './LandingPage.css';

const SHOWCASE_CARDS = [
  {
    _id: 'landing-gold',
    name: 'Rodrigo',
    preferredPosition: 'ST',
    offensiveOverall: 91,
    defensiveOverall: 45,
    athleticismOverall: 88,
    cardImage: '/assets/player7.png',
    cardTitle: 'gold',
  },
  {
    _id: 'landing-silver',
    name: 'Kerem',
    preferredPosition: 'CM',
    offensiveOverall: 74,
    defensiveOverall: 71,
    athleticismOverall: 76,
    cardImage: '/assets/player12.png',
    cardTitle: 'silver',
  },
  {
    _id: 'landing-bronze',
    name: 'Deniz',
    preferredPosition: 'CB',
    offensiveOverall: 48,
    defensiveOverall: 66,
    athleticismOverall: 58,
    cardImage: '/assets/player3.png',
    cardTitle: 'bronze',
  },
];

const FEATURES = [
  {
    icon: 'bi-person-badge-fill',
    title: 'FIFA-Style Cards',
    text: 'Create a card for every player in your squad — stats, positions and tiers that reflect how they really play.',
  },
  {
    icon: 'bi-person-fill-gear',
    title: 'Squad Management',
    text: 'Build and manage your roster, compare players side by side and keep every card up to date.',
  },
  {
    icon: 'bi-clipboard-check-fill',
    title: 'Match Organizer',
    text: 'Pick formations, balance teams automatically and announce the match to everyone with one click.',
  },
  {
    icon: 'bi-people-fill',
    title: 'Crews & Friends',
    text: 'Group your regulars into crews, invite friends and grow the competition week after week.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Sign Up',
    text: 'Create your free account in seconds and open your own CardTeur league.',
  },
  {
    number: '02',
    title: 'Create Your Cards',
    text: 'Add your squad and craft a FIFA-style card for every player — bronze to gold.',
  },
  {
    number: '03',
    title: 'Organize the Match',
    text: 'Build balanced teams on the pitch, save the lineup and announce match day.',
  },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-wrapper landing">
      <div className="page-container">
        {/* ── Hero ── */}
        <section className="landing__hero">
          <div className="landing__hero-copy">
            <span className="landing__hero-badge">Amateur Football, Pro Experience</span>
            <h1 className="landing__hero-title">
              Turn Your Squad Into <span>Legends</span>
            </h1>
            <p className="landing__hero-sub">
              CardTeur builds FIFA-style cards for your amateur squad, balances your teams
              and organizes match day — so you only think about playing.
            </p>
            <div className="landing__hero-actions">
              <button className="landing__cta" onClick={() => navigate('/signup')}>
                Get Started
                <i className="bi bi-arrow-right"></i>
              </button>
              <button className="landing__cta landing__cta--ghost" onClick={() => navigate('/login')}>
                Login
              </button>
            </div>
          </div>
          <div className="landing__hero-cards">
            {SHOWCASE_CARDS.map((card, index) => (
              <div key={card._id} className={`landing__hero-card landing__hero-card--${index}`}>
                <Card {...card} />
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="landing__section">
          <div className="landing__section-header">
            <h2 className="landing__section-title">Everything Match Day Needs</h2>
          </div>
          <div className="landing__features">
            {FEATURES.map(feature => (
              <div key={feature.title} className="landing__feature">
                <i className={`bi ${feature.icon} landing__feature-icon`}></i>
                <h3 className="landing__feature-title">{feature.title}</h3>
                <p className="landing__feature-text">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="landing__section">
          <div className="landing__section-header">
            <h2 className="landing__section-title">How It Works</h2>
          </div>
          <div className="landing__steps">
            {STEPS.map(step => (
              <div key={step.number} className="landing__step">
                <span className="landing__step-number">{step.number}</span>
                <h3 className="landing__step-title">{step.title}</h3>
                <p className="landing__step-text">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="landing__bottom-cta">
          <h2 className="landing__bottom-title">
            Ready to build your <span>CardTeur</span> league?
          </h2>
          <button className="landing__cta" onClick={() => navigate('/signup')}>
            Create Free Account
            <i className="bi bi-arrow-right"></i>
          </button>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;

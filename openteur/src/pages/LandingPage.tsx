import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
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

const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const features = [
    { icon: 'bi-person-badge-fill', title: t('landing.featureCardsTitle'), text: t('landing.featureCardsText') },
    { icon: 'bi-person-fill-gear', title: t('landing.featureSquadTitle'), text: t('landing.featureSquadText') },
    { icon: 'bi-clipboard-check-fill', title: t('landing.featureMatchTitle'), text: t('landing.featureMatchText') },
    { icon: 'bi-people-fill', title: t('landing.featureCrewTitle'), text: t('landing.featureCrewText') },
  ];

  const steps = [
    { number: '01', title: t('landing.step1Title'), text: t('landing.step1Text') },
    { number: '02', title: t('landing.step2Title'), text: t('landing.step2Text') },
    { number: '03', title: t('landing.step3Title'), text: t('landing.step3Text') },
  ];

  return (
    <div className="page-wrapper landing">
      <div className="page-container">
        {/* ── Hero ── */}
        <section className="landing__hero">
          <div className="landing__hero-copy">
            <span className="landing__hero-badge">{t('landing.badge')}</span>
            <h1 className="landing__hero-title">
              <Trans i18nKey="landing.heroTitle" components={{ accent: <span /> }} />
            </h1>
            <p className="landing__hero-sub">{t('landing.heroSub')}</p>
            <div className="landing__hero-actions">
              <button className="landing__cta" onClick={() => navigate('/signup')}>
                {t('landing.getStarted')}
                <i className="bi bi-arrow-right"></i>
              </button>
              <button className="landing__cta landing__cta--ghost" onClick={() => navigate('/login')}>
                {t('nav.login')}
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
            <h2 className="landing__section-title">{t('landing.featuresTitle')}</h2>
          </div>
          <div className="landing__features">
            {features.map(feature => (
              <div key={feature.icon} className="landing__feature">
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
            <h2 className="landing__section-title">{t('landing.howTitle')}</h2>
          </div>
          <div className="landing__steps">
            {steps.map(step => (
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
            <Trans i18nKey="landing.bottomTitle" components={{ accent: <span /> }} />
          </h2>
          <button className="landing__cta" onClick={() => navigate('/signup')}>
            {t('landing.bottomCta')}
            <i className="bi bi-arrow-right"></i>
          </button>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import Card from '../components/Card';
import FootballPitch, { PitchPlayer } from '../components/FootballPitch';
import '../components/FootballPitch.css';
import { getFormationSet } from '../data/formations';
import './LandingPage.css';

// Reveals a section with a rise/fade transition the first time it scrolls into view.
function useRevealOnScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

const DEMO_POSITIONS = ['ST', 'CM', 'CB', 'GK'];

const MATCH_DEMO_FORMATION = getFormationSet(5)[0];
const MATCH_DEMO_NAMES = ['Kaan', 'Deniz', 'Emre', 'Baran', 'Yusuf'];
const MATCH_DEMO_PLAYERS: PitchPlayer[] = MATCH_DEMO_FORMATION.slots.map((slot, i) => ({
  id: `landing-demo-${i}`,
  name: MATCH_DEMO_NAMES[i] ?? `Player ${i + 1}`,
  role: slot.role,
  overall: 64 + ((i * 7) % 28),
  cardImage: `/assets/player${(i % 36) + 1}.png`,
  x: slot.x,
  y: slot.y,
  offOvr: 58 + i * 6,
  defOvr: 52 + i * 5,
  athOvr: 68 + i * 4,
  stamOvr: 74,
}));
const MATCH_DEMO_OVR = Math.round(
  MATCH_DEMO_PLAYERS.reduce((sum, p) => sum + p.overall, 0) / MATCH_DEMO_PLAYERS.length
);
const MATCH_DEMO_ROLES = [...new Set(MATCH_DEMO_FORMATION.slots.map(s => s.role))];

// Individual sub-stats, not broad categories — voters nudge specific stats
// (e.g. +3 Dribbling), matching how a real card is edited in AddPlayerForm.
type VoteStatKey = 'dribbling' | 'shortPass' | 'tackling' | 'stamina';
const VOTE_STAT_KEYS: VoteStatKey[] = ['dribbling', 'shortPass', 'tackling', 'stamina'];
const VOTE_TEAMMATES: Array<{ id: string; name: string; base: Record<VoteStatKey, number> }> = [
  { id: 'deniz', name: 'Deniz', base: { dribbling: 68, shortPass: 72, tackling: 65, stamina: 70 } },
  { id: 'baran', name: 'Baran', base: { dribbling: 74, shortPass: 58, tackling: 52, stamina: 80 } },
];

const clampVoteStep = (value: number) => Math.max(-3, Math.min(3, value));

const SHOWCASE_CARDS = [
  {
    _id: 'landing-gold',
    name: 'Liam',
    preferredPosition: 'ST',
    offensiveOverall: 91,
    defensiveOverall: 45,
    athleticismOverall: 88,
    cardImage: '/assets/player7.png',
    cardTitle: 'gold',
  },
  {
    _id: 'landing-silver',
    name: 'Alberto',
    preferredPosition: 'CM',
    offensiveOverall: 74,
    defensiveOverall: 71,
    athleticismOverall: 76,
    cardImage: '/assets/player12.png',
    cardTitle: 'silver',
  },
  {
    _id: 'landing-bronze',
    name: 'Aslan',
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

  const [demoPosition, setDemoPosition] = useState('ST');
  const [demoOff, setDemoOff] = useState(74);
  const [demoDef, setDemoDef] = useState(56);
  const [demoAth, setDemoAth] = useState(81);
  const demoOverall = Math.round((demoOff + demoDef + demoAth) / 3);
  const demoTier = demoOverall >= 80 ? 'gold' : demoOverall >= 65 ? 'silver' : 'bronze';

  const emptyVoteDeltas = () =>
    Object.fromEntries(VOTE_TEAMMATES.map(p => [p.id, Object.fromEntries(VOTE_STAT_KEYS.map(k => [k, 0]))])) as Record<
      string,
      Record<VoteStatKey, number>
    >;
  const [votingDeltas, setVotingDeltas] = useState<Record<string, Record<VoteStatKey, number>>>(emptyVoteDeltas);
  const [votesSubmitted, setVotesSubmitted] = useState(false);

  const handleVoteStep = (playerId: string, stat: VoteStatKey, direction: 1 | -1) => {
    setVotingDeltas(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], [stat]: clampVoteStep(prev[playerId][stat] + direction) },
    }));
  };

  const handleResetVotes = () => {
    setVotingDeltas(emptyVoteDeltas());
    setVotesSubmitted(false);
  };

  const featuresReveal = useRevealOnScroll<HTMLElement>();
  const stepsReveal = useRevealOnScroll<HTMLElement>();
  const votingReveal = useRevealOnScroll<HTMLElement>();
  const builderReveal = useRevealOnScroll<HTMLElement>();
  const matchPreviewReveal = useRevealOnScroll<HTMLElement>();
  const bottomReveal = useRevealOnScroll<HTMLElement>();

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
        <section
          ref={featuresReveal.ref}
          className={`landing__section landing__reveal ${featuresReveal.visible ? 'is-visible' : ''}`}
        >
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
        <section
          ref={stepsReveal.ref}
          className={`landing__section landing__reveal ${stepsReveal.visible ? 'is-visible' : ''}`}
        >
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

        {/* ── Voting system (flagship feature) ── */}
        <section
          ref={votingReveal.ref}
          className={`landing__section landing__reveal landing__voting ${votingReveal.visible ? 'is-visible' : ''}`}
        >
          <div className="landing__voting-intro">
            <span className="landing__badge">{t('landing.votingBadge')}</span>
            <h2 className="landing__builder-title">{t('landing.votingTitle')}</h2>
            <p className="landing__builder-text landing__voting-text">{t('landing.votingText')}</p>
          </div>

          <div className="landing__voting-points">
            <div className="landing__voting-point">
              <i className="bi bi-lightning-charge-fill"></i>
              <div>
                <h4>{t('landing.votingPoint1Title')}</h4>
                <p>{t('landing.votingPoint1Text')}</p>
              </div>
            </div>
            <div className="landing__voting-point">
              <i className="bi bi-person-badge-fill"></i>
              <div>
                <h4>{t('landing.votingPoint2Title')}</h4>
                <p>{t('landing.votingPoint2Text')}</p>
              </div>
            </div>
            <div className="landing__voting-point">
              <i className="bi bi-graph-up-arrow"></i>
              <div>
                <h4>{t('landing.votingPoint3Title')}</h4>
                <p>{t('landing.votingPoint3Text')}</p>
              </div>
            </div>
          </div>

          <div className="landing__voting-demo">
            {VOTE_TEAMMATES.map(player => {
              const deltas = votingDeltas[player.id];
              return (
                <div key={player.id} className="landing__voting-card">
                  <div className="landing__voting-card__header">
                    <span className="landing__voting-card__name">{player.name}</span>
                  </div>
                  {VOTE_STAT_KEYS.map(stat => {
                    const delta = deltas[stat];
                    return (
                      <div key={stat} className="landing__voting-stat">
                        <span className="landing__voting-stat__label">{t(`stats.${stat}`)}</span>
                        <div className="landing__voting-stepper">
                          <button
                            type="button"
                            className="landing__voting-stepper__btn"
                            disabled={votesSubmitted || delta <= -3}
                            onClick={() => handleVoteStep(player.id, stat, -1)}
                            aria-label={`-1 ${stat}`}
                          >
                            <i className="bi bi-dash"></i>
                          </button>
                          <span
                            className={`landing__voting-stepper__val ${delta > 0 ? 'positive' : delta < 0 ? 'negative' : ''}`}
                          >
                            {delta > 0 ? '+' : ''}{delta}
                          </span>
                          <button
                            type="button"
                            className="landing__voting-stepper__btn"
                            disabled={votesSubmitted || delta >= 3}
                            onClick={() => handleVoteStep(player.id, stat, 1)}
                            aria-label={`+1 ${stat}`}
                          >
                            <i className="bi bi-plus"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {votesSubmitted && (
                    <div className="landing__voting-result">
                      {VOTE_STAT_KEYS.map(stat => {
                        const delta = deltas[stat];
                        const newVal = Math.max(1, Math.min(99, player.base[stat] + delta));
                        return (
                          <div key={stat} className="landing__voting-result__row">
                            <span>{t(`stats.${stat}`)}</span>
                            <span className="landing__voting-result__stats">
                              {player.base[stat]} <i className="bi bi-arrow-right"></i> {newVal}
                              <span className={`landing__voting-result__delta ${delta >= 0 ? 'positive' : 'negative'}`}>
                                {delta >= 0 ? '+' : ''}{delta}
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="landing__voting-actions">
            {!votesSubmitted ? (
              <button className="landing__cta" onClick={() => setVotesSubmitted(true)}>
                {t('landing.votingSubmitCta')}
                <i className="bi bi-check2"></i>
              </button>
            ) : (
              <>
                <span className="landing__voting-success">
                  <i className="bi bi-stars"></i> {t('landing.votingSuccessMsg')}
                </span>
                <button className="landing__cta landing__cta--ghost" onClick={handleResetVotes}>
                  {t('landing.votingResetCta')}
                </button>
              </>
            )}
          </div>

          <button className="landing__cta landing__voting-main-cta" onClick={() => navigate('/signup')}>
            {t('landing.votingCta')}
            <i className="bi bi-arrow-right"></i>
          </button>
        </section>

        {/* ── Build your own card (interactive demo) ── */}
        <section
          ref={builderReveal.ref}
          className={`landing__section landing__reveal landing__builder ${builderReveal.visible ? 'is-visible' : ''}`}
        >
          <div className="landing__builder-copy">
            <span className="landing__badge">{t('landing.cardBuilderBadge')}</span>
            <h2 className="landing__builder-title">{t('landing.cardBuilderTitle')}</h2>
            <p className="landing__builder-text">{t('landing.cardBuilderText')}</p>

            <div className="landing__builder-controls">
              <div className="landing__builder-field">
                <label>
                  <span>{t('playerForm.offensive')}</span>
                  <span className="landing__builder-val">{demoOff}</span>
                </label>
                <input
                  type="range"
                  min={30}
                  max={99}
                  value={demoOff}
                  onChange={e => setDemoOff(Number(e.target.value))}
                  className="landing__slider landing__slider--off"
                />
              </div>
              <div className="landing__builder-field">
                <label>
                  <span>{t('playerForm.defensive')}</span>
                  <span className="landing__builder-val">{demoDef}</span>
                </label>
                <input
                  type="range"
                  min={30}
                  max={99}
                  value={demoDef}
                  onChange={e => setDemoDef(Number(e.target.value))}
                  className="landing__slider landing__slider--def"
                />
              </div>
              <div className="landing__builder-field">
                <label>
                  <span>{t('playerForm.athleticism')}</span>
                  <span className="landing__builder-val">{demoAth}</span>
                </label>
                <input
                  type="range"
                  min={30}
                  max={99}
                  value={demoAth}
                  onChange={e => setDemoAth(Number(e.target.value))}
                  className="landing__slider landing__slider--ath"
                />
              </div>

              <div className="landing__builder-positions">
                {DEMO_POSITIONS.map(pos => (
                  <button
                    key={pos}
                    type="button"
                    className={`landing__pos-btn ${demoPosition === pos ? 'active' : ''}`}
                    onClick={() => setDemoPosition(pos)}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            <button className="landing__cta" onClick={() => navigate('/signup')}>
              {t('landing.cardBuilderCta')}
              <i className="bi bi-arrow-right"></i>
            </button>
          </div>

          <div className="landing__builder-preview">
            <Card
              _id="landing-demo-card"
              name={t('landing.cardBuilderCardName')}
              preferredPosition={demoPosition}
              offensiveOverall={demoOff}
              defensiveOverall={demoDef}
              athleticismOverall={demoAth}
              cardImage="/assets/player20.png"
              cardTitle={demoTier}
            />
          </div>
        </section>

        {/* ── Match page preview ── */}
        <section
          ref={matchPreviewReveal.ref}
          className={`landing__section landing__reveal landing__match-preview ${matchPreviewReveal.visible ? 'is-visible' : ''}`}
        >
          <div className="landing__match-preview-pitch">
            <FootballPitch
              players={MATCH_DEMO_PLAYERS}
              teamLabel="A"
              teamOvr={MATCH_DEMO_OVR}
              teamStaminaOvr={76}
              formationRoles={MATCH_DEMO_ROLES}
              readOnly
              onMove={() => {}}
              onChangeTeam={() => {}}
              onChangeRole={() => {}}
            />
          </div>
          <div className="landing__match-preview-copy">
            <span className="landing__badge">{t('landing.matchPreviewBadge')}</span>
            <h2 className="landing__builder-title">{t('landing.matchPreviewTitle')}</h2>
            <p className="landing__builder-text">{t('landing.matchPreviewText')}</p>
            <button className="landing__cta" onClick={() => navigate('/signup')}>
              {t('landing.matchPreviewCta')}
              <i className="bi bi-arrow-right"></i>
            </button>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section
          ref={bottomReveal.ref}
          className={`landing__bottom-cta landing__reveal ${bottomReveal.visible ? 'is-visible' : ''}`}
        >
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

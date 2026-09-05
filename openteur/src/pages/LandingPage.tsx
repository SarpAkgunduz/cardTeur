import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import Card from '../components/Card';
import FootballPitch, { PitchPlayer } from '../components/FootballPitch';
import '../components/FootballPitch.css';
import { getFormationSet } from '../data/formations';
import { calculateAverage, computeCardTitle, computeOverall } from '../utils/playerRating';
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

// Demo squad carries the same fields a real Player document does, so the landing
// preview can run the exact rating helpers the app uses instead of faking numbers.
interface DemoSquadPlayer {
  id: string;
  name: string;
  preferredPosition: string;
  offensiveOverall: number;
  defensiveOverall: number;
  athleticismOverall: number;
  gkOverall?: number;
  stamina: number;
  cardImage: string;
}

const MATCH_DEMO_FORMATION = getFormationSet(5)[0];
const MATCH_DEMO_ROLES = [...new Set(MATCH_DEMO_FORMATION.slots.map(s => s.role))];

const DEMO_SQUAD: DemoSquadPlayer[] = [
  { id: 'demo-1', name: 'Kenji',  preferredPosition: 'GK', offensiveOverall: 32, defensiveOverall: 58, athleticismOverall: 66, gkOverall: 78, stamina: 62, cardImage: '/assets/player1.webp' },
  { id: 'demo-2', name: 'Mateo', preferredPosition: 'CB', offensiveOverall: 46, defensiveOverall: 81, athleticismOverall: 72, stamina: 75, cardImage: '/assets/player2.webp' },
  { id: 'demo-3', name: 'Emre',  preferredPosition: 'CM', offensiveOverall: 74, defensiveOverall: 63, athleticismOverall: 77, stamina: 82, cardImage: '/assets/player3.webp' },
  { id: 'demo-4', name: 'Luca', preferredPosition: 'CM', offensiveOverall: 69, defensiveOverall: 58, athleticismOverall: 84, stamina: 88, cardImage: '/assets/player4.webp' },
  { id: 'demo-5', name: 'Diego', preferredPosition: 'ST', offensiveOverall: 86, defensiveOverall: 41, athleticismOverall: 79, stamina: 71, cardImage: '/assets/player5.webp' },
  { id: 'demo-6', name: 'Noah',  preferredPosition: 'LW', offensiveOverall: 78, defensiveOverall: 44, athleticismOverall: 88, stamina: 80, cardImage: '/assets/player6.webp' },
  { id: 'demo-7', name: 'Omar',  preferredPosition: 'CB', offensiveOverall: 39, defensiveOverall: 74, athleticismOverall: 68, stamina: 70, cardImage: '/assets/player8.webp' },
  { id: 'demo-8', name: 'Yusuf',   preferredPosition: 'CM', offensiveOverall: 66, defensiveOverall: 61, athleticismOverall: 73, stamina: 77, cardImage: '/assets/player9.webp' },
];

const DEMO_BY_ID: Record<string, DemoSquadPlayer> = Object.fromEntries(
  DEMO_SQUAD.map(p => [p.id, p])
);

const DEMO_STARTER_IDS = DEMO_SQUAD.slice(0, MATCH_DEMO_FORMATION.slots.length).map(p => p.id);
const DEMO_BENCH_IDS = DEMO_SQUAD.slice(MATCH_DEMO_FORMATION.slots.length).map(p => p.id);

const DEMO_START_POSITIONS: Record<string, { x: number; y: number }> = Object.fromEntries(
  DEMO_STARTER_IDS.map((id, i) => [id, { x: MATCH_DEMO_FORMATION.slots[i].x, y: MATCH_DEMO_FORMATION.slots[i].y }])
);

const DEMO_START_ROLES: Record<string, string> = Object.fromEntries(
  DEMO_STARTER_IDS.map((id, i) => [id, MATCH_DEMO_FORMATION.slots[i].role])
);

const SHOWCASE_CARDS = [
  {
    _id: 'landing-gold',
    name: 'Liam',
    preferredPosition: 'ST',
    offensiveOverall: 91,
    defensiveOverall: 45,
    athleticismOverall: 88,
    cardImage: '/assets/player7.webp',
    cardTitle: 'gold',
  },
  {
    _id: 'landing-silver',
    name: 'Alberto',
    preferredPosition: 'CM',
    offensiveOverall: 74,
    defensiveOverall: 71,
    athleticismOverall: 76,
    cardImage: '/assets/player12.webp',
    cardTitle: 'silver',
  },
  {
    _id: 'landing-bronze',
    name: 'Aslan',
    preferredPosition: 'CB',
    offensiveOverall: 48,
    defensiveOverall: 66,
    athleticismOverall: 58,
    cardImage: '/assets/player3.webp',
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

  // Mirrors the real Player document: the visitor edits the same sub-stats the app
  // stores, and the overalls/tier are derived from them exactly as usePlayerForm does.
  const [demoPosition, setDemoPosition] = useState('ST');
  const [demoStats, setDemoStats] = useState({
    dribbling: 82, shotAccuracy: 78, shotSpeed: 74, headers: 63,
    longPass: 66, shortPass: 77, ballControl: 84, positioning: 79, vision: 71,
    tackling: 46, interceptions: 52, marking: 44, defensiveIQ: 55,
    speed: 88, strength: 69, stamina: 80,
    diving: 74, handling: 71, kicking: 66, reflexes: 79, gkPositioning: 73, gkSpeed: 64,
  });

  const setDemoStat = (key: keyof typeof demoStats, value: number) =>
    setDemoStats(prev => ({ ...prev, [key]: value }));

  const demoIsGK = demoPosition === 'GK';

  const demoOff = calculateAverage([
    demoStats.dribbling, demoStats.shotAccuracy, demoStats.shotSpeed, demoStats.headers,
    demoStats.ballControl, demoStats.vision, demoStats.positioning, demoStats.longPass, demoStats.shortPass,
  ]);
  const demoDef = calculateAverage([demoStats.tackling, demoStats.interceptions, demoStats.marking]);
  const demoAth = calculateAverage([demoStats.speed, demoStats.strength, demoStats.stamina]);
  const demoGkOverall = calculateAverage([
    demoStats.diving, demoStats.handling, demoStats.kicking,
    demoStats.reflexes, demoStats.gkPositioning, demoStats.gkSpeed,
  ]);

  const demoTier = computeCardTitle({
    offensiveOverall: demoOff,
    defensiveOverall: demoDef,
    athleticismOverall: demoAth,
    gkOverall: demoGkOverall,
    isGK: demoIsGK,
  });

  const demoStatGroups = demoIsGK
    ? [{
        id: 'gk' as const,
        label: t('playerForm.goalkeeper'),
        overall: demoGkOverall,
        modifier: 'ath',
        fields: [
          { key: 'diving' as const,        label: t('stats.diving') },
          { key: 'handling' as const,      label: t('stats.handling') },
          { key: 'kicking' as const,       label: t('stats.kicking') },
          { key: 'reflexes' as const,      label: t('stats.reflexes') },
          { key: 'gkPositioning' as const, label: t('stats.gkPositioning') },
          { key: 'gkSpeed' as const,       label: t('stats.gkSpeed') },
        ],
      }]
    : [
        {
          id: 'offensive' as const,
          label: t('playerForm.offensive'),
          overall: demoOff,
          modifier: 'off',
          fields: [
            { key: 'dribbling' as const,    label: t('stats.dribbling') },
            { key: 'shotAccuracy' as const, label: t('stats.shotAccuracy') },
            { key: 'shotSpeed' as const,    label: t('stats.shotSpeed') },
            { key: 'headers' as const,      label: t('stats.headers') },
            { key: 'longPass' as const,     label: t('stats.longPass') },
            { key: 'shortPass' as const,    label: t('stats.shortPass') },
            { key: 'ballControl' as const,  label: t('stats.ballControl') },
            { key: 'positioning' as const,  label: t('stats.positioning') },
            { key: 'vision' as const,       label: t('stats.vision') },
          ],
        },
        {
          id: 'defensive' as const,
          label: t('playerForm.defensive'),
          overall: demoDef,
          modifier: 'def',
          fields: [
            { key: 'tackling' as const,      label: t('stats.tackling') },
            { key: 'interceptions' as const, label: t('stats.interceptions') },
            { key: 'marking' as const,       label: t('stats.marking') },
            { key: 'defensiveIQ' as const,   label: t('stats.defensiveIQ') },
          ],
        },
        {
          id: 'athleticism' as const,
          label: t('playerForm.athleticism'),
          overall: demoAth,
          modifier: 'ath',
          fields: [
            { key: 'speed' as const,    label: t('stats.speed') },
            { key: 'strength' as const, label: t('stats.strength') },
            { key: 'stamina' as const,  label: t('stats.stamina') },
          ],
        },
      ];

  const [demoTab, setDemoTab] = useState<string>('offensive');
  const activeDemoGroup = demoStatGroups.find(g => g.id === demoTab) ?? demoStatGroups[0];

  // Interactive match demo — mirrors MatchPage's pitch/bench state so visitors get
  // the real drag, role-change and substitution behaviour before signing up.
  const [demoPitchIds, setDemoPitchIds] = useState<string[]>(DEMO_STARTER_IDS);
  const [demoBenchIds, setDemoBenchIds] = useState<string[]>(DEMO_BENCH_IDS);
  const [demoPositions, setDemoPositions] = useState(DEMO_START_POSITIONS);
  const [demoRoles, setDemoRoles] = useState(DEMO_START_ROLES);

  const demoPitchPlayers: PitchPlayer[] = useMemo(
    () => demoPitchIds.map(id => {
      const p = DEMO_BY_ID[id];
      const role = demoRoles[id] ?? p.preferredPosition;
      return {
        id,
        name: p.name,
        role,
        overall: Math.round(computeOverall(p, role)),
        cardImage: p.cardImage,
        x: demoPositions[id]?.x ?? 50,
        y: demoPositions[id]?.y ?? 50,
        offOvr: p.offensiveOverall,
        defOvr: p.defensiveOverall,
        athOvr: p.athleticismOverall,
        stamOvr: p.stamina,
      };
    }),
    [demoPitchIds, demoPositions, demoRoles]
  );

  const demoTeamOvr = demoPitchPlayers.length
    ? Math.round(demoPitchPlayers.reduce((sum, p) => sum + p.overall, 0) / demoPitchPlayers.length)
    : 0;
  const demoTeamStamina = demoPitchPlayers.length
    ? Math.round(demoPitchPlayers.reduce((sum, p) => sum + p.stamOvr, 0) / demoPitchPlayers.length)
    : 0;

  const handleDemoMove = (id: string, x: number, y: number) =>
    setDemoPositions(prev => ({ ...prev, [id]: { x, y } }));

  const handleDemoRole = (id: string, role: string) =>
    setDemoRoles(prev => ({ ...prev, [id]: role }));

  const handleDemoBench = (id: string) => {
    setDemoPitchIds(prev => prev.filter(p => p !== id));
    setDemoBenchIds(prev => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleDemoAddFromBench = (id: string) => {
    if (demoPitchIds.length >= MATCH_DEMO_FORMATION.slots.length) return;
    const takenSlots = new Set(
      demoPitchIds.map(pid => `${demoPositions[pid]?.x},${demoPositions[pid]?.y}`)
    );
    const freeSlot = MATCH_DEMO_FORMATION.slots.find(slot => !takenSlots.has(`${slot.x},${slot.y}`));
    setDemoBenchIds(prev => prev.filter(p => p !== id));
    setDemoPitchIds(prev => [...prev, id]);
    setDemoPositions(prev => ({ ...prev, [id]: { x: freeSlot?.x ?? 50, y: freeSlot?.y ?? 50 } }));
    setDemoRoles(prev => ({ ...prev, [id]: freeSlot?.role ?? DEMO_BY_ID[id].preferredPosition }));
  };

  const featuresReveal = useRevealOnScroll<HTMLElement>();
  const stepsReveal = useRevealOnScroll<HTMLElement>();
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
              <div className="landing__stat-tabs">
                {demoStatGroups.map(group => (
                  <button
                    key={group.id}
                    type="button"
                    className={`landing__stat-tab ${activeDemoGroup.id === group.id ? 'active' : ''}`}
                    onClick={() => setDemoTab(group.id)}
                  >
                    {group.label}
                    <span className="landing__stat-tab-ovr">{group.overall}</span>
                  </button>
                ))}
              </div>

              {activeDemoGroup.fields.map(field => (
                <div className="landing__builder-field" key={field.key}>
                  <label>
                    <span>{field.label}</span>
                    <span className="landing__builder-val">{demoStats[field.key]}</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={99}
                    value={demoStats[field.key]}
                    onChange={e => setDemoStat(field.key, Number(e.target.value))}
                    className={`landing__slider landing__slider--${activeDemoGroup.modifier}`}
                  />
                </div>
              ))}

              <div className="landing__builder-positions">
                {DEMO_POSITIONS.map(pos => (
                  <button
                    key={pos}
                    type="button"
                    className={`landing__pos-btn ${demoPosition === pos ? 'active' : ''}`}
                    onClick={() => {
                      setDemoPosition(pos);
                      setDemoTab(pos === 'GK' ? 'gk' : 'offensive');
                    }}
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
              gkOverall={demoGkOverall}
              reflexes={demoStats.reflexes}
              handling={demoStats.handling}
              diving={demoStats.diving}
              cardImage="/assets/player20.webp"
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
              players={demoPitchPlayers}
              teamLabel="A"
              teamOvr={demoTeamOvr}
              teamStaminaOvr={demoTeamStamina}
              formationRoles={MATCH_DEMO_ROLES}
              onMove={handleDemoMove}
              onBench={handleDemoBench}
              onChangeRole={handleDemoRole}
            />

            <div className="landing__bench">
              <div className="landing__bench-header">
                <i className="bi bi-person-lines-fill" />
                {t('match.bench')}
                {demoBenchIds.length > 0 && (
                  <span className="landing__bench-count">{demoBenchIds.length}</span>
                )}
              </div>
              {demoBenchIds.length === 0 ? (
                <p className="landing__bench-empty">{t('match.benchEmpty')}</p>
              ) : (
                <div className="landing__bench-list">
                  {demoBenchIds.map(id => {
                    const p = DEMO_BY_ID[id];
                    return (
                      <div className="landing__bench-row" key={id}>
                        <div className="landing__bench-info">
                          <span className="landing__bench-name">{p.name}</span>
                          <span className="landing__bench-pos">{p.preferredPosition}</span>
                        </div>
                        <span className="landing__bench-ovr">{Math.round(computeOverall(p))}</span>
                        <button
                          type="button"
                          className="landing__bench-btn"
                          onClick={() => handleDemoAddFromBench(id)}
                          disabled={demoPitchIds.length >= MATCH_DEMO_FORMATION.slots.length}
                          title={t('match.addToTeam', { team: 'A' })}
                        >
                          <i className="bi bi-plus-lg" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <p className="landing__pitch-hint">
              <i className="bi bi-info-circle" />
              {t('match.pitchHint')}
            </p>
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

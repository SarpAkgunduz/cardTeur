import React, { useState, useEffect } from 'react';
import BackButton from '../components/BackButton';
import { useNavigate, useParams } from 'react-router-dom';
import ToastNotification from '../components/ToastNotification';
import { playerApi } from '../services';
import { validatePlayer } from '../utils/validatePlayer';
import './AddPlayerForm.css';

const AddPlayerForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  // State variables for player attributes
  const [name, setName] = useState('');
  const [cardImage, setCardImage] = useState('');
  const [jerseyNumber, setjerseyNumber] = useState<number | string>('');
  const [marketValue, setMarketValue] = useState<number | string>('');
  const [preferredPosition, setpreferredPosition] = useState('');
  const [activeStatTab, setActiveStatTab] = useState<'gk' | 'offensive' | 'defensive'>('offensive');
    // Sub-stats
    // Offensive stats
  const [dribbling, setDribbling] = useState(0);
  const [shotAccuracy, setShotAccuracy] = useState(0);
  const [shotSpeed, setShotSpeed] = useState(0);
  const [headers, setHeader] = useState(0);
  const [longPass, setLongPass] = useState(0);
  const [shortPass, setShortPass] = useState(0);
  const [ballControl, setBallControl] = useState(0);
  const [positioning, setPositioning] = useState(0);
  const [vision, setVision] = useState(0);
    // Defensive stats
  const [tackling, setTackling] = useState(0);
  const [interceptions, setInterceptions] = useState(0);
  const [marking, setMarking] = useState(0);
  const [defensiveIQ, setDefensiveIQ] = useState(0);
    // Athleticism stats
  const [speed, setSpeed] = useState(0);
  const [strength, setStrength] = useState(0);
  const [stamina, setStamina] = useState(0);

  // GK stats
  const [diving, setDiving] = useState(0);
  const [handling, setHandling] = useState(0);
  const [kicking, setKicking] = useState(0);
  const [reflexes, setReflexes] = useState(0);
  const [gkPositioning, setGkPositioning] = useState(0);
  const [gkSpeed, setGkSpeed] = useState(0);


  const offensiveStats = [dribbling, shotAccuracy, shotSpeed, headers, ballControl, vision, positioning, longPass, shortPass];
  const defensiveStats = [tackling, interceptions, marking];
  const athleticismStats = [speed, strength, stamina];
  const gkStats = [diving, handling, kicking, reflexes, gkPositioning, gkSpeed];
  
  // Load player data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      playerApi.getById(id)
        .then((player) => {
          setName(player.name);
          setCardImage(player.cardImage);
          setjerseyNumber(player.jerseyNumber);
          setMarketValue(player.marketValue);
          setpreferredPosition(player.preferredPosition);
          setDribbling(player.dribbling ?? 0);
          setShotAccuracy(player.shotAccuracy ?? 0);
          setShotSpeed(player.shotSpeed ?? 0);
          setHeader(player.headers ?? 0);
          setLongPass(player.longPass ?? 0);
          setShortPass(player.shortPass ?? 0);
          setBallControl(player.ballControl ?? 0);
          setPositioning(player.positioning ?? 0);
          setVision(player.vision ?? 0);
          setTackling(player.tackling ?? 0);
          setInterceptions(player.interceptions ?? 0);
          setMarking(player.marking ?? 0);
          setDefensiveIQ(player.defensiveIQ ?? 0);
          setSpeed(player.speed ?? 0);
          setStrength(player.strength ?? 0);
          setStamina(player.stamina ?? 0);
          setDiving(player.diving ?? 0);
          setHandling(player.handling ?? 0);
          setKicking(player.kicking ?? 0);
          setReflexes(player.reflexes ?? 0);
          setGkPositioning(player.gkPositioning ?? 0);
          setGkSpeed(player.gkSpeed ?? 0);
        })
        .catch((error) => {
          console.error('Failed to fetch player:', error);
          setToastMsg('Failed to load player data');
          setShowToast(true);
        });
    } else {
      console.log('ℹ️ Not in edit mode. ID:', id, 'isEditMode:', isEditMode);
    }
  }, [id, isEditMode]);
  
  // Overalls (calculated)
  const calculateAverage = (stats: number[]) =>
    stats.length ? Math.round(stats.reduce((a, b) => a + b, 0) / stats.length) : 0;
    const offensiveOverall = calculateAverage(offensiveStats);
    const defensiveOverall = calculateAverage(defensiveStats);
    const athleticismOverall = calculateAverage(athleticismStats);
    const gkOverall = calculateAverage(gkStats);

    const isGK = preferredPosition === 'GK';

    // Card title selection
    let cardTitle: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
    if (isGK) {
      if (gkOverall > 90) cardTitle = 'platinum';
      else if (gkOverall > 80) cardTitle = 'gold';
      else if (gkOverall > 60) cardTitle = 'silver';
    } else {
      const defScore = (defensiveOverall + athleticismOverall) / 2;
      const offScore = (offensiveOverall + athleticismOverall) / 2;
      if (defScore > 90 || offScore > 90) cardTitle = 'platinum';
      else if (defScore > 80 || offScore > 80) cardTitle = 'gold';
      else if (defScore > 60 || offScore > 60) cardTitle = 'silver';
    }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newPlayer = {
        name,
        jerseyNumber: Number(jerseyNumber),
        preferredPosition,
        cardTitle,
        marketValue: marketValue !== '' ? Number(marketValue) : 0,
        cardImage,
        offensiveOverall,
        defensiveOverall,
        athleticismOverall,
        // Sub-stats
        // Offensive stats
        dribbling,
        shotAccuracy,
        shotSpeed,
        headers,
        longPass,
        shortPass,
        ballControl,
        positioning,
        vision,

        // Defensive stats
        tackling,
        interceptions,
        marking,
        defensiveIQ,

        // Athleticism stats
        speed,
        strength,
        stamina,

        // GK stats  
        gkOverall,
        diving,
        handling,
        kicking,
        reflexes,
        gkPositioning,
        gkSpeed,
      };
    
    // Frontend validation — check all rules before hitting the backend
    const validationError = validatePlayer(newPlayer, isGK, jerseyNumber, marketValue);
    if (validationError) {
      setToastMsg(validationError);
      setShowToast(true);
      return;
    }

    try {
      if (isEditMode && id) {
        // Update existing player
        await playerApi.update(id, newPlayer);
        setToastMsg('Player updated successfully!');
      } else {
        // Create new player
        await playerApi.create(newPlayer);
        setToastMsg('Player added successfully!');
      }
      
      setShowToast(true);
      setTimeout(() => {
        navigate('/manage');
      }, 3000);
    } catch (error) {
      console.error('Error saving player:', error);
      setToastMsg(`Error ${isEditMode ? 'updating' : 'adding'} player.`);
      setShowToast(true);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <ToastNotification
          show={showToast}
          message={toastMsg}
          onClose={() => setShowToast(false)}
        />

        <div className="content-card">
          <div className="back-button-container" style={{ marginBottom: '20px' }}>
            <BackButton position="static" />
          </div>

          <h2 className="page-title" style={{ marginBottom: '30px' }}>
            {isEditMode ? 'Edit Player' : 'Add Player'}
          </h2>

          <form onSubmit={handleSubmit}>

            {/* ── SECTION 1: IDENTITY ── */}
            <div className="form-section">
              <div className="form-section-header">
                <i className="bi bi-person-badge-fill"></i>
                <span>Player Identity</span>
              </div>
              <div className="identity-grid">
                <div className="stat-field">
                  <label htmlFor="name">Player Name</label>
                  <input
                    id="name"
                    className="form-control-dark"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="stat-field">
                  <label htmlFor="jerseyNumber">Jersey Number</label>
                  <input
                    id="jerseyNumber"
                    className="form-control-dark"
                    placeholder="e.g. 10"
                    type="number"
                    value={jerseyNumber}
                    onChange={(e) => setjerseyNumber(e.target.value)}
                  />
                </div>
                <div className="stat-field">
                  <label htmlFor="marketValue">Market Value</label>
                  <input
                    id="marketValue"
                    type="number"
                    min={0}
                    className="form-control-dark"
                    placeholder="e.g. 5000000"
                    value={marketValue}
                    onChange={(e) => setMarketValue(e.target.value)}
                  />
                </div>
                <div className="stat-field">
                  <label htmlFor="preferredPosition">Preferred Position</label>
                  <select
                    id="preferredPosition"
                    className="form-select-dark"
                    value={preferredPosition}
                    onChange={(e) => {
                      setpreferredPosition(e.target.value);
                      setActiveStatTab(e.target.value === 'GK' ? 'gk' : 'offensive');
                    }}
                  >
                    <option value="">-- Choose --</option>
                    <option value="ST">Striker (ST)</option>
                    <option value="LW">Left Winger (LW)</option>
                    <option value="RW">Right Winger (RW)</option>
                    <option value="CAM">Attacking Mid (CAM)</option>
                    <option value="CM">Central Mid (CM)</option>
                    <option value="CDM">Defensive Mid (CDM)</option>
                    <option value="LB">Left Back (LB)</option>
                    <option value="RB">Right Back (RB)</option>
                    <option value="CB">Center Back (CB)</option>
                    <option value="GK">Goalkeeper (GK)</option>
                    <option value="LM">Left Mid (LM)</option>
                    <option value="RM">Right Mid (RM)</option>
                  </select>
                </div>
                <div className="stat-field full-width">
                  <label htmlFor="cardImage">Player Photo</label>
                  <select
                    id="cardImage"
                    className="form-select-dark"
                    value={cardImage}
                    onChange={(e) => setCardImage(e.target.value)}
                  >
                    <option value="">-- Choose an image --</option>
                    <option value="/assets/sakgunduz.png">Sarp Akgündüz</option>
                    <option value="/assets/faksakal.png">Furkan Mert Aksakal</option>
                    <option value="/assets/rbesen.png">Ruşen Besen</option>
                    <option value="/assets/eakkoc.png">Emre Akkoç</option>
                    <option value="/assets/celbir.png">Zekeriya Cengiz</option>
                    <option value="/assets/fimaro.png">Furkan İmaro</option>
                    <option value="/assets/raltunel.png">Rıdvan Altunel</option>
                    <option value="/assets/eyildirim.png">Emre Yıldırım</option>
                    <option value="/assets/ambostan.png">Ali Mert Bostan</option>
                    <option value="/assets/dbekaroglu.png">Doğa Bekaroğlu</option>
                    <option value="/assets/berdinc.png">Burak Erdinç</option>
                    <option value="/assets/ycetin.png">Yasin Çetin</option>
                  </select>
                </div>
                {cardImage && (
                  <div className="stat-field full-width image-preview-row">
                    <img src={cardImage} alt="preview" className="player-preview-img" />
                  </div>
                )}
              </div>
            </div>

            {/* ── SECTION 2–4: STATS (tabbed) ── */}
            <div className="form-section">
              {/* Tab bar */}
              <div className="stat-tabs">
                {preferredPosition === 'GK' && (
                  <button
                    type="button"
                    className={`stat-tab ${activeStatTab === 'gk' ? 'active' : ''}`}
                    onClick={() => setActiveStatTab('gk')}
                  >
                    <i className="bi bi-shield-shaded me-1"></i>GK Stats
                  </button>
                )}
                <button
                  type="button"
                  className={`stat-tab ${activeStatTab === 'offensive' ? 'active' : ''}`}
                  onClick={() => setActiveStatTab('offensive')}
                >
                  <i className="bi bi-lightning-fill me-1"></i>Offensive
                </button>
                <button
                  type="button"
                  className={`stat-tab ${activeStatTab === 'defensive' ? 'active' : ''}`}
                  onClick={() => setActiveStatTab('defensive')}
                >
                  <i className="bi bi-shield-fill me-1"></i>Defensive &amp; Athleticism
                </button>
              </div>

              {/* GK Stats tab */}
              {activeStatTab === 'gk' && preferredPosition === 'GK' && (
                <div className="stat-grid" style={{ marginTop: 16 }}>
                  {[
                    { id: 'diving',        label: 'Diving',      value: diving,        setter: setDiving },
                    { id: 'handling',      label: 'Handling',    value: handling,      setter: setHandling },
                    { id: 'kicking',       label: 'Kicking',     value: kicking,       setter: setKicking },
                    { id: 'reflexes',      label: 'Reflexes',    value: reflexes,      setter: setReflexes },
                    { id: 'gkPositioning', label: 'Positioning', value: gkPositioning, setter: setGkPositioning },
                    { id: 'gkSpeed',       label: 'Speed',       value: gkSpeed,       setter: setGkSpeed },
                  ].map(({ id, label, value, setter }) => (
                    <div className="stat-field" key={id}>
                      <label htmlFor={id}>{label}</label>
                      <input id={id} type="number" min={0} max={100} className="stat-input"
                        value={value} onChange={(e) => setter(Math.min(100, Math.max(0, +e.target.value)))} />
                      <div className="stat-bar-track"><div className="stat-bar-fill" style={{ width: `${value}%` }} /></div>
                    </div>
                  ))}
                </div>
              )}

              {/* Offensive Stats tab */}
              {activeStatTab === 'offensive' && (
                <div className="stat-grid" style={{ marginTop: 16 }}>
                  {[
                    { id: 'dribbling',    label: 'Dribbling',     value: dribbling,    setter: setDribbling },
                    { id: 'shotAccuracy', label: 'Shot Accuracy', value: shotAccuracy, setter: setShotAccuracy },
                    { id: 'shotSpeed',    label: 'Shot Speed',    value: shotSpeed,    setter: setShotSpeed },
                    { id: 'headers',      label: 'Headers',       value: headers,      setter: setHeader },
                    { id: 'longPass',     label: 'Long Pass',     value: longPass,     setter: setLongPass },
                    { id: 'shortPass',    label: 'Short Pass',    value: shortPass,    setter: setShortPass },
                    { id: 'ballControl',  label: 'Ball Control',  value: ballControl,  setter: setBallControl },
                    { id: 'positioning',  label: 'Positioning',   value: positioning,  setter: setPositioning },
                    { id: 'vision',       label: 'Vision',        value: vision,       setter: setVision },
                  ].map(({ id, label, value, setter }) => (
                    <div className="stat-field" key={id}>
                      <label htmlFor={id}>{label}</label>
                      <input id={id} type="number" min={0} max={100} className="stat-input"
                        value={value} onChange={(e) => setter(Math.min(100, Math.max(0, +e.target.value)))} />
                      <div className="stat-bar-track"><div className="stat-bar-fill" style={{ width: `${value}%` }} /></div>
                    </div>
                  ))}
                </div>
              )}

              {/* Defensive & Athleticism tab */}
              {activeStatTab === 'defensive' && (
                <>
                  <p className="stat-subheader" style={{ marginTop: 16 }}>Defensive</p>
                  <div className="stat-grid">
                    {[
                      { id: 'tackling',      label: 'Tackling',      value: tackling,      setter: setTackling },
                      { id: 'interceptions', label: 'Interceptions', value: interceptions, setter: setInterceptions },
                      { id: 'marking',       label: 'Marking',       value: marking,       setter: setMarking },
                      { id: 'defensiveIQ',   label: 'Defensive IQ',  value: defensiveIQ,   setter: setDefensiveIQ },
                    ].map(({ id, label, value, setter }) => (
                      <div className="stat-field" key={id}>
                        <label htmlFor={id}>{label}</label>
                        <input id={id} type="number" min={0} max={100} className="stat-input"
                          value={value} onChange={(e) => setter(Math.min(100, Math.max(0, +e.target.value)))} />
                        <div className="stat-bar-track"><div className="stat-bar-fill" style={{ width: `${value}%` }} /></div>
                      </div>
                    ))}
                  </div>
                  <p className="stat-subheader" style={{ marginTop: 24 }}>Athleticism</p>
                  <div className="stat-grid">
                    {[
                      { id: 'speed',    label: 'Speed',    value: speed,    setter: setSpeed },
                      { id: 'strength', label: 'Strength', value: strength, setter: setStrength },
                      { id: 'stamina',  label: 'Stamina',  value: stamina,  setter: setStamina },
                    ].map(({ id, label, value, setter }) => (
                      <div className="stat-field" key={id}>
                        <label htmlFor={id}>{label}</label>
                        <input id={id} type="number" min={0} max={100} className="stat-input"
                          value={value} onChange={(e) => setter(Math.min(100, Math.max(0, +e.target.value)))} />
                        <div className="stat-bar-track"><div className="stat-bar-fill" style={{ width: `${value}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ── SECTION 5: SUMMARY & SUBMIT ── */}
            <div className="form-section">
              <div className="form-section-header">
                <i className="bi bi-clipboard-check-fill"></i>
                <span>Summary</span>
              </div>

              <div className="overall-badges-row">
                {preferredPosition === 'GK' ? (
                  <div className="overall-badge">
                    <span className="badge-title">Goalkeeper</span>
                    <span className="badge-value">{gkOverall}</span>
                    <span className="badge-label">OVR</span>
                  </div>
                ) : (
                  <>
                    <div className="overall-badge">
                      <span className="badge-title">Offensive</span>
                      <span className="badge-value">{offensiveOverall}</span>
                      <span className="badge-label">OVR</span>
                    </div>
                    <div className="overall-badge">
                      <span className="badge-title">Defensive</span>
                      <span className="badge-value">{defensiveOverall}</span>
                      <span className="badge-label">OVR</span>
                    </div>
                    <div className="overall-badge">
                      <span className="badge-title">Athleticism</span>
                      <span className="badge-value">{athleticismOverall}</span>
                      <span className="badge-label">OVR</span>
                    </div>
                  </>
                )}
              </div>

              <div className="card-title-row">
                <span className={`card-title-pill ${cardTitle}`}>
                  {cardTitle.charAt(0).toUpperCase() + cardTitle.slice(1)}
                </span>
              </div>

              <div className="form-submit-row">
                <button type="submit" className="btn btn-ct">
                  <i className={`bi ${isEditMode ? 'bi-pencil-fill' : 'bi-person-plus-fill'} me-2`}></i>
                  {isEditMode ? 'Update Player' : 'Add Player'}
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPlayerForm;

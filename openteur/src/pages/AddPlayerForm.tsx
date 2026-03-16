import React, { useState, useEffect } from 'react';
import BackButton from '../components/BackButton';
import { useNavigate, useParams } from 'react-router-dom';
import ToastNotification from '../components/ToastNotification';
import { playerApi } from '../services';
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


  const offensiveStats = [dribbling, shotAccuracy, shotSpeed, headers, ballControl, vision, positioning, longPass, shortPass];
  const defensiveStats = [tackling, interceptions, marking];
  const athleticismStats = [speed, strength, stamina];
  
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
          setDribbling(player.dribbling);
          setShotAccuracy(player.shotAccuracy);
          setShotSpeed(player.shotSpeed);
          setHeader(player.headers);
          setLongPass(player.longPass);
          setShortPass(player.shortPass);
          setBallControl(player.ballControl);
          setPositioning(player.positioning);
          setVision(player.vision);
          setTackling(player.tackling);
          setInterceptions(player.interceptions);
          setMarking(player.marking);
          setDefensiveIQ(player.defensiveIQ);
          setSpeed(player.speed);
          setStrength(player.strength);
          setStamina(player.stamina);
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

    // Card title selection
    const defScore = (defensiveOverall + athleticismOverall) / 2;
    const offScore = (offensiveOverall + athleticismOverall) / 2;

    let cardTitle: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
    if (defScore > 90 || offScore > 90) {
        cardTitle = 'platinum';
    } else if (defScore > 80 || offScore > 80) {
        cardTitle = 'gold';
    } else if (defScore > 60 || offScore > 60) {
        cardTitle = 'silver';
    }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newPlayer = {
        name,
        jerseyNumber: Number(jerseyNumber),
        preferredPosition,
        cardTitle,
        marketValue: String(marketValue),
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
      };
    
    // Check for missing required fields (excluding marketValue)
    const isEmpty = (value: unknown) => value === "" || value === null || value === undefined;

    const missing = Object.entries(newPlayer)
    .filter(([key, value]) => key !== 'marketValue' && isEmpty(value))
    .map(([key]) => key);

    if (missing.length > 0) {
      setToastMsg(`Please fill these fields: ${missing.join(", ")}`);
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
        navigate('/edit');
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
                    className="form-control-dark"
                    placeholder="e.g. 5M"
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
                    onChange={(e) => setpreferredPosition(e.target.value)}
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

            {/* ── SECTION 2: OFFENSIVE STATS ── */}
            <div className="form-section">
              <div className="form-section-header">
                <i className="bi bi-lightning-fill"></i>
                <span>Offensive Stats</span>
              </div>
              <div className="stat-grid">
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
                    <input
                      id={id}
                      type="number"
                      min={0}
                      max={100}
                      className="stat-input"
                      value={value}
                      onChange={(e) => setter(Math.min(100, Math.max(0, +e.target.value)))}
                    />
                    <div className="stat-bar-track">
                      <div className="stat-bar-fill" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── SECTION 3: DEFENSIVE & ATHLETICISM ── */}
            <div className="form-section">
              <div className="form-section-header">
                <i className="bi bi-shield-fill"></i>
                <span>Defensive &amp; Athleticism</span>
              </div>

              <p className="stat-subheader">Defensive</p>
              <div className="stat-grid">
                {[
                  { id: 'tackling',     label: 'Tackling',      value: tackling,     setter: setTackling },
                  { id: 'interceptions',label: 'Interceptions', value: interceptions,setter: setInterceptions },
                  { id: 'marking',      label: 'Marking',       value: marking,      setter: setMarking },
                  { id: 'defensiveIQ',  label: 'Defensive IQ',  value: defensiveIQ,  setter: setDefensiveIQ },
                ].map(({ id, label, value, setter }) => (
                  <div className="stat-field" key={id}>
                    <label htmlFor={id}>{label}</label>
                    <input
                      id={id}
                      type="number"
                      min={0}
                      max={100}
                      className="stat-input"
                      value={value}
                      onChange={(e) => setter(Math.min(100, Math.max(0, +e.target.value)))}
                    />
                    <div className="stat-bar-track">
                      <div className="stat-bar-fill" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <p className="stat-subheader" style={{ marginTop: '24px' }}>Athleticism</p>
              <div className="stat-grid">
                {[
                  { id: 'speed',    label: 'Speed',    value: speed,    setter: setSpeed },
                  { id: 'strength', label: 'Strength', value: strength, setter: setStrength },
                  { id: 'stamina',  label: 'Stamina',  value: stamina,  setter: setStamina },
                ].map(({ id, label, value, setter }) => (
                  <div className="stat-field" key={id}>
                    <label htmlFor={id}>{label}</label>
                    <input
                      id={id}
                      type="number"
                      min={0}
                      max={100}
                      className="stat-input"
                      value={value}
                      onChange={(e) => setter(Math.min(100, Math.max(0, +e.target.value)))}
                    />
                    <div className="stat-bar-track">
                      <div className="stat-bar-fill" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── SECTION 4: SUMMARY & SUBMIT ── */}
            <div className="form-section">
              <div className="form-section-header">
                <i className="bi bi-clipboard-check-fill"></i>
                <span>Summary</span>
              </div>

              <div className="overall-badges-row">
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

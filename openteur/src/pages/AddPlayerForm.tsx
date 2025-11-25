import React, { useState } from 'react';
import BackButton from '../components/BackButton';
import { useNavigate } from 'react-router-dom';
import ToastNotification from '../components/ToastNotification';

const AddPlayerForm = () => {

  
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
  const [finishing, setFinishing] = useState(0);
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


  const offensiveStats = [dribbling, shotAccuracy, shotSpeed, headers,ballControl, vision, positioning, finishing, longPass, shortPass];
  const defensiveStats = [tackling, interceptions, marking];
  const athleticismStats = [speed, strength, stamina];
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
        jerseyNumber,
        preferredPosition,
        cardTitle,
        marketValue,
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
        finishing,
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
    
    // Check for missing required fields  
    const isEmpty = (value: unknown) => value === "" || value === null || value === undefined;

    const missing = Object.entries(newPlayer)
    .filter(([, value]) => isEmpty(value))
    .map(([key]) => key);

    if (missing.length > 0) {
      setToastMsg(`Please fill these fields: ${missing.join(", ")}`);
      setShowToast(true);
      return;
    }
    const res = await fetch('http://localhost:5000/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPlayer),
    });

    if (res.ok) {
      setToastMsg('Player added successfully!');
      setShowToast(true);
      setTimeout(() => {
        navigate('/edit');
      }, 3000); // let user see the toast for 3 seconds, then redirect
    } else {
      alert('Error adding player.');
    }
  };

  return (
    <div className="container mt-4">
      {/* Toast Notification */}
      <ToastNotification
      show={showToast}
      message={toastMsg}
      onClose={() => setShowToast(false)}
      />

      {/* Back button */}
      <BackButton position="absolute" top="20px" right="20px" />

      {/* Form for adding a player */}
    <form onSubmit={handleSubmit} className="container mt-4">
      <h2 className="mb-4">Add Player</h2>

      {/* Name input */}
      <input
        className="form-control mb-2"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {/* Jersey number input */}
      <input
        className="form-control mb-2"
        placeholder="Jersey Number"
        type="number"
        value={jerseyNumber}
        onChange={(e) => setjerseyNumber(e.target.value)}
      />
      {/* Market value input */}
      <input
        className="form-control mb-2"
        placeholder="Market Value"
        type="string"
        value={marketValue}
        onChange={(e) => setMarketValue(e.target.value)}
      />
      {/* Preferred position input */}
      <h5>Preferred Position</h5>
      <select
        className="form-select mb-2"
        value={preferredPosition}
        onChange={(e) => setpreferredPosition(e.target.value)}
      >
        <option value="">-- Choose a position --</option>
        <option value="ST">Striker</option>
        <option value="LW">Left Winger</option>
        <option value="RW">Right Winger</option>
        <option value="CAM">Central Attacking Midfielder</option>
        <option value="CM">Central Midfielder</option>
        <option value="CDM">Central Defensive Midfielder</option>
        <option value="LB">Left Back</option>
        <option value="RB">Right Back</option>
        <option value="CB">Center Back</option>
        <option value="GK">Goalkeeper</option>
        <option value="LM">Left Midfielder</option>
        <option value="RM">Right Midfielder</option>
      </select>
  
      {/* Image select */}
      <h5>Select Player Image</h5>
      <select
        className="form-select mb-3"
        value={cardImage}
        onChange={(e) => setCardImage(e.target.value)}
      >
        <option value="">-- Choose an image --</option>
        <option value="/assets/sakgunduz.png">Sarp Akgündüz</option>
        <option value="/assets/faksakal.png">Furkan Mert Aksakal</option>
        <option value="/assets/rbesen.png">Ruşen Besen</option>
        <option value="/assets/eakkoc.png">Emre Akkoç</option>
        <option value="/assets/celbir.png">Zekeriya Cengiz</option>
        <option value="/assets/fimaro.png">Emre Karakaş</option>
      </select>
  
      {/* Preview */}
      {cardImage && (
        <div className="text-center mb-3">
          <img
            src={cardImage}
            alt="preview"
            className="img-thumbnail"
            style={{ width: '150px' }}
          />
        </div>
      )}
  
      {/* Offensive Stats */}
      <h5>Offensive Stats</h5>

      <label htmlFor="dribbling">Dribbling</label>
      <input id="dribbling" type="number" min={0} max={100} className="form-control mb-2" value={dribbling} onChange={(e) => setDribbling(+e.target.value)} />

      <label htmlFor="shotAccuracy">Shot Accuracy</label>
      <input id="shotAccuracy" type="number" min={0} max={100} className="form-control mb-2" value={shotAccuracy} onChange={(e) => setShotAccuracy(+e.target.value)} />

      <label htmlFor="shotSpeed">Shot Speed</label>
      <input id="shotSpeed" type="number" min={0} max={100} className="form-control mb-2" value={shotSpeed} onChange={(e) => setShotSpeed(+e.target.value)} />

      <label htmlFor="headers">Headers</label>
      <input id="headers" type="number" min={0} max={100} className="form-control mb-2" value={headers} onChange={(e) => setHeader(+e.target.value)} />
      
      <label htmlFor="finishing">Offensive IQ</label>
      <input id="finishing" type="number" min={0} max={100} className="form-control mb-2" value={finishing} onChange={(e) => setFinishing(+e.target.value)} />

      <label htmlFor="longPass">Long Pass</label>
      <input id="longPass" type="number" min={0} max={100} className="form-control mb-2" value={longPass} onChange={(e) => setLongPass(+e.target.value)} />

      <label htmlFor="shortPass">Short Pass</label>
      <input id="shortPass" type="number" min={0} max={100} className="form-control mb-3" value={shortPass} onChange={(e) => setShortPass(+e.target.value)} />

      <label htmlFor="ballControl">Ball Control</label>
      <input id="ballControl" type="number" min={0} max={100} className="form-control mb-3" value={ballControl} onChange={(e) => setBallControl(+e.target.value)} />

      <label htmlFor="positioning">Positioning</label>
      <input id="positioning" type="number" min={0} max={100} className="form-control mb-2" value={positioning} onChange={(e) => setPositioning(+e.target.value)} />
      
      <label htmlFor="vision">Vision</label>
      <input id="vision" type="number" min={0} max={100} className="form-control mb-2" value={vision} onChange={(e) => setVision(+e.target.value)} />
      


      {/* Defensive Stats */}
      <h5>Defensive Stats</h5>

      <label htmlFor="tackling">Tackling</label>
      <input id="tackling" type="number" min={0} max={100} className="form-control mb-2" value={tackling} onChange={(e) => setTackling(+e.target.value)} />

      <label htmlFor="interceptions">Interceptions</label>
      <input id="interceptions" type="number" min={0} max={100} className="form-control mb-2" placeholder="Interceptions" value={interceptions} onChange={(e) => setInterceptions(+e.target.value)} />

      <label htmlFor="marking">Marking</label>
      <input id="marking" type="number" min={0} max={100} className="form-control mb-3" placeholder="Marking" value={marking} onChange={(e) => setMarking(+e.target.value)} />

      <label htmlFor="defensiveIQ">Defensive IQ</label>
      <input id="defensiveIQ" type="number" min={0} max={100} className="form-control mb-2" placeholder="Defensive IQ" value={defensiveIQ} onChange={(e) => setDefensiveIQ(+e.target.value)} />
  
      {/* Athleticism Stats */}
      <h5>Athleticism Stats</h5>

      <label htmlFor="speed">Speed</label>
      <input
        id="speed"
        type="number"
        className="form-control mb-2"
        value={speed}
        min={0} max={100}
        onChange={(e) => setSpeed(+e.target.value)}
      />

      <label htmlFor="strength">Strength</label>
      <input
        id="strength"
        type="number"
        className="form-control mb-2"
        value={strength}
        min={0} max={100}
        onChange={(e) => setStrength(+e.target.value)}
      />

      <label htmlFor="stamina">Stamina</label>
      <input
        id="stamina"
        type="number"
        className="form-control mb-3"
        value={stamina}
        min={0} max={100}
        onChange={(e) => setStamina(+e.target.value)}
      />
  
      {/* Calculated Overalls */}
      <div className="mt-4">
        <h5>Calculated Overalls</h5>
        <p>Offense: {offensiveOverall}</p>
        <p>Defense: {defensiveOverall}</p>
        <p>Athleticism: {athleticismOverall}</p>
      </div>
  
      {/* Submit */}
      <button type="submit" className="btn btn-primary mt-3">
        Add Player
      </button>
    </form>
    </div>
  );
  
};

export default AddPlayerForm;

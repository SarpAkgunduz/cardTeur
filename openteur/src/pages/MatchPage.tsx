import React, { useState, useEffect, useRef } from 'react';
import BackButton from '../components/BackButton';
import Card from '../components/Card';
import MatchDetailsModal from '../components/MatchDetailsModal';
import ToastNotification from '../components/ToastNotification';
import { playerApi } from '../services';
import './MatchPage.css';

const MatchPage = () => {
  const [selectedMode, setSelectedMode] = useState<'advance' | 'standard' | null>(null);
  const [showCountPanel, setShowCountPanel] = useState(false);
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [slotsVisible, setSlotsVisible] = useState(false);

  // new states
  const [playersPool, setPlayersPool] = useState<any[]>([]);
  const [leftPlayers, setLeftPlayers] = useState<any[]>([]);
  const [rightPlayers, setRightPlayers] = useState<any[]>([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'danger'>('success');
  const [showToast, setShowToast] = useState(false);

  // move these above the useEffect that calls distributePlayers
  const computeOverall = (p: any) => {
    const toNum = (v: any) => {
      if (v === null || v === undefined || v === '') return 0;
      // remove non-numeric chars (e.g. spaces, %), then parse
      const cleaned = (typeof v === 'string') ? v.replace(/[^\d.-]/g, '') : String(v);
      const n = parseFloat(cleaned);
      return Number.isFinite(n) ? n : 0;
    };
    const v1 = toNum(p.offensiveOverall ?? p.offensive);
    const v2 = toNum(p.defensiveOverall ?? p.defensive);
    const v3 = toNum(p.athleticismOverall ?? p.athleticism);
    const parts = [v1, v2, v3].filter(x => x > 0);
    const denom = parts.length > 0 ? parts.length : 3;
    return (v1 + v2 + v3) / denom;
  };

  const distributePlayers = (pool: any[], countPerSide: number) => {
    const arr = pool
      .map(p => ({ ...p, __overall: computeOverall(p) }))
      // remove the filter that can drop players if __overall was invalid
      .sort((a, b) => b.__overall - a.__overall);
    const left: any[] = [];
    const right: any[] = [];
    let sumL = 0;
    let sumR = 0;
    for (const p of arr) {
      if (left.length < countPerSide && right.length < countPerSide) {
        if (sumL <= sumR) { left.push(p); sumL += p.__overall; }
        else { right.push(p); sumR += p.__overall; }
      } else if (left.length < countPerSide) {
        left.push(p); sumL += p.__overall;
      } else if (right.length < countPerSide) {
        right.push(p); sumR += p.__overall;
      }
      if (left.length === countPerSide && right.length === countPerSide) break;
    }
    return { left, right };
  };

  useEffect(() => {
    // load players once
    const fetchPlayers = async () => {
      try {
        const data = await playerApi.getAll();
        console.log('playersPool fetched:', data.length, data[0] ? data[0] : null);
        setPlayersPool(data);
      } catch (err) {
        console.error('Failed to load players pool', err);
      }
    };
    fetchPlayers();
  }, []);

  useEffect(() => {
    // when playerCount or pool changes, distribute automatically
    console.log('distribute triggered, playerCount=', playerCount, 'pool=', playersPool.length);
    if (!playerCount || playerCount < 1 || playersPool.length === 0) {
      setLeftPlayers([]);
      setRightPlayers([]);
      setSlotsVisible(false);
      return;
    }
    const { left, right } = distributePlayers(playersPool, playerCount);
    console.log('distributed -> left:', left.length, ' right:', right.length, { left, right });
    setLeftPlayers(left);
    setRightPlayers(right);
    // auto-show slots after distribution
    setSlotsVisible(true);
  }, [playersPool, playerCount]);

  const handleModeSelect = (mode: 'advance' | 'standard') => {
    console.log('mode selected ->', mode);
    setSelectedMode(mode);
    setShowCountPanel(true);
    setPlayerCount(null);
    setSlotsVisible(false);
  };

  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmitCount = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = inputRef.current?.value ?? '';
    console.log('submit count (from ref) rawValue=', raw);
    const n = parseInt(raw as string, 10);
    if (!n || n < 1) {
      console.log('invalid playerCount, aborting', n);
      return;
    }
    setPlayerCount(n);
    setSlotsVisible(true); // show slots immediately
  };

  const handleAnnounce = async (details: { location: string; date: string; time: string }) => {
    const toMatchPlayer = (p: any) => ({
      name: p.name ?? 'Unknown',
      email: p.email ?? undefined,
      preferredPosition: p.preferredPosition ?? p.position ?? undefined,
    });

    try {
      const res = await fetch('http://localhost:5001/api/match/announce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...details,
          leftTeam: leftPlayers.map(toMatchPlayer),
          rightTeam: rightPlayers.map(toMatchPlayer),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Unknown error');
      setToastMsg(`Announced! Emails sent to ${data.sent.length} player(s).`);
      setToastVariant('success');
    } catch (err: any) {
      setToastMsg(`Failed to send emails: ${err.message}`);
      setToastVariant('danger');
    }
    setShowMatchModal(false);
    setShowToast(true);
  };

  const renderColumnSlots = (assigned: any[], count: number | null) => {
    const n = count ?? 0;
    return Array.from({ length: n }).map((_, i) => {
      const p = assigned[i];
      if (!p) return null;
      return (
        <div key={i} className={`player-slot ${slotsVisible ? 'slot-enter' : ''}`}>
          <Card
            _id={p._id ?? p.id ?? ''}
            name={p.name ?? 'Unknown'}
            preferredPosition={p.preferredPosition ?? p.position ?? '—'}
            offensiveOverall={Number(p.offensiveOverall ?? p.offensive ?? 0)}
            defensiveOverall={Number(p.defensiveOverall ?? p.defensive ?? 0)}
            athleticismOverall={Number(p.athleticismOverall ?? p.athleticism ?? 0)}
            gkOverall={p.gkOverall != null ? Number(p.gkOverall) : undefined}
            cardImage={p.cardImage ?? p.image ?? ''}
          />
        </div>
      );
    });
  };

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <ToastNotification
          show={showToast}
          message={toastMsg}
          onClose={() => setShowToast(false)}
          variant={toastVariant}
        />

        {showMatchModal && (
          <MatchDetailsModal
            leftTeam={leftPlayers.map((p) => ({
              name: p.name ?? 'Unknown',
              email: p.email ?? undefined,
              preferredPosition: p.preferredPosition ?? undefined,
            }))}
            rightTeam={rightPlayers.map((p) => ({
              name: p.name ?? 'Unknown',
              email: p.email ?? undefined,
              preferredPosition: p.preferredPosition ?? undefined,
            }))}
            onSkip={() => setShowMatchModal(false)}
            onAnnounce={handleAnnounce}
          />
        )}
        <div className="page-header">
          <div className="back-button-container">
            <BackButton position="static" />
          </div>
          <h1 className="page-title">Select Match Mode</h1>
        </div>

        <div className="content-card">
          <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className={`mode-button ${selectedMode === 'advance' ? 'mode-selected' : ''}`}
              onClick={() => handleModeSelect('advance')}
              aria-pressed={selectedMode === 'advance'}
            >
              <i className="bi bi-lightning-charge-fill mode-icon"></i>
              <h2>Advance Match</h2>
              <p>Detailed statistics and advanced tactics</p>
            </button>

            <button
              className={`mode-button ${selectedMode === 'standard' ? 'mode-selected' : ''}`}
              onClick={() => handleModeSelect('standard')}
              aria-pressed={selectedMode === 'standard'}
            >
              <i className="bi bi-shield-fill-check mode-icon"></i>
              <h2>Standard Match</h2>
              <p>Quick match with basic rules</p>
            </button>
          </div>

          {showCountPanel && (
            <div className="count-panel-backdrop">
              <form className="count-panel card-white" onSubmit={handleSubmitCount}>
                <h3>How many players for each side?</h3>
                <p className="muted">Enter a number (1 - 11). Left and right teams will each have this many slots.</p>
                <div className="count-input-row">
                  <input
                    ref={inputRef}
                    type="number"
                    min={1}
                    max={11}
                    defaultValue={playerCount ?? ''}
                    onChange={(e) => console.log('input changed:', e.target.value)}
                    className="count-input"
                    autoFocus
                  />
                  <span className="vs-text">vs <strong>{playerCount ?? 0}</strong></span>
                </div>
                <div className="count-actions">
                  <button type="button" className="btn btn-ct active-mode" onClick={() => setShowCountPanel(false)}>Cancel</button>
                  <button type="submit" className="btn btn-ct" onClick={() => handleSubmitCount()}>Create</button>
                </div>
              </form>
            </div>
          )}

          {/* Sides layout: left slots | center white area | right slots */}
          <div className="sides-wrapper" style={{ marginTop: 20 }}>
            <div className="side-column left-column">
              {renderColumnSlots(leftPlayers, playerCount)}
            </div>

            <div className="center-card">
              {/* center panel — match board + ready button */}
              <div className="card-white center-small">
                <h4 style={{ margin: 6 }}>Match Board</h4>
                <p className="muted" style={{ margin: 6 }}>Mode: {selectedMode ?? '—'}</p>

                {slotsVisible && leftPlayers.length > 0 && rightPlayers.length > 0 && (
                  <button
                    className="btn btn-ct match-ready-btn"
                    style={{ marginTop: 14, width: '100%' }}
                    onClick={() => setShowMatchModal(true)}
                  >
                    <i className="bi bi-check2-circle me-1"></i>
                    Ready
                  </button>
                )}
              </div>
            </div>

            <div className="side-column right-column">
              {renderColumnSlots(rightPlayers, playerCount)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchPage;

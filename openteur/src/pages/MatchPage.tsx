import { useState, useEffect } from 'react';
import BackButton from '../components/BackButton';
import FootballPitch, { PitchPlayer } from '../components/FootballPitch';
import MatchDetailsModal from '../components/MatchDetailsModal';
import ToastNotification from '../components/ToastNotification';
import { usePlayers } from '../contexts/PlayerContext';
import { apiRequest } from '../services/api/apiClient';
import './MatchPage.css';
import { PLAYER_COUNT_OPTIONS, getFormationSet, smartAssign } from '../data/formations';



const MatchPage = () => {
  const { players } = usePlayers();
  const [playersPool, setPlayersPool]    = useState<any[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [leftPlayers, setLeftPlayers]    = useState<any[]>([]);
  const [rightPlayers, setRightPlayers]   = useState<any[]>([]);
  const [playerCount, setPlayerCount]     = useState<number>(8);
  const [formationA, setFormationA]       = useState('');
  const [formationB, setFormationB]       = useState('');
  const [positionsA, setPositionsA]       = useState<Record<string, { x: number; y: number }>>({});
  const [positionsB, setPositionsB]       = useState<Record<string, { x: number; y: number }>>({});
  // Role overrides per player (applied on top of slot-based role)
  const [roleOverridesA, setRoleOverridesA] = useState<Record<string, string>>({});
  const [roleOverridesB, setRoleOverridesB] = useState<Record<string, string>>({});
  const [pitchMode, setPitchMode]         = useState(false);
  const [savedMatchId, setSavedMatchId]   = useState<string | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [toastMsg, setToastMsg]           = useState('');
  const [toastVariant, setToastVariant]   = useState<'success' | 'danger'>('success');
  const [showToast, setShowToast]         = useState(false);

  const showToastMsg = (msg: string, variant: 'success' | 'danger' = 'success') => {
    setToastMsg(msg);
    setToastVariant(variant);
    setShowToast(true);
  };

  const toNum = (v: any) => {
    if (v === null || v === undefined || v === '') return 0;
    const n = parseFloat(typeof v === 'string' ? v.replace(/[^\d.-]/g, '') : String(v));
    return Number.isFinite(n) ? n : 0;
  };

  const computeOverall = (p: any): number => {
    const v1 = toNum(p.offensiveOverall ?? p.offensive);
    const v2 = toNum(p.defensiveOverall ?? p.defensive);
    const v3 = toNum(p.athleticismOverall ?? p.athleticism);
    const parts = [v1, v2, v3].filter(x => x > 0);
    return (v1 + v2 + v3) / (parts.length || 3);
  };

  const distributePlayers = (pool: any[], countPerSide: number) => {
    const arr = pool.map(p => ({ ...p, __ovr: computeOverall(p) })).sort((a, b) => b.__ovr - a.__ovr);
    const left: any[] = [], right: any[] = [];
    let sumL = 0, sumR = 0;
    for (const p of arr) {
      if (left.length >= countPerSide && right.length >= countPerSide) break;
      if (left.length < countPerSide && right.length < countPerSide) {
        if (sumL <= sumR) { left.push(p); sumL += p.__ovr; }
        else { right.push(p); sumR += p.__ovr; }
      } else if (left.length < countPerSide) { left.push(p); sumL += p.__ovr; }
      else { right.push(p); sumR += p.__ovr; }
    }
    return { left, right };
  };

  useEffect(() => {
    setPlayersPool(players);
    setSelectedPlayerIds(new Set(players.map(p => p._id)));
  }, [players]);

  useEffect(() => {
    const active = playersPool.filter(p => selectedPlayerIds.has(p._id));
    if (active.length === 0) { setLeftPlayers([]); setRightPlayers([]); return; }
    const { left, right } = distributePlayers(active, playerCount);
    setLeftPlayers(left);
    setRightPlayers(right);
    setPitchMode(false);
    setSavedMatchId(null);
  }, [playersPool, playerCount, selectedPlayerIds]);

  const computeTeamOvr = (players: any[]) => {
    if (!players.length) return 0;
    return Math.round(players.reduce((s, p) => s + computeOverall(p), 0) / players.length);
  };

  const computeTeamStaminaOvr = (players: any[]) =>
    players.length ? Math.round(players.reduce((s, p) => s + toNum(p.stamina), 0) / players.length) : 0;

  const toPitchPlayers = (
    players: any[],
    positions: Record<string, { x: number; y: number }>,
    slotRoles: string[],
    roleOverrides: Record<string, string>,
  ): PitchPlayer[] =>
    players.map((p, i) => ({
      id: p._id ?? p.id ?? '',
      name: p.name ?? 'Unknown',
      role: roleOverrides[p._id ?? p.id] ?? slotRoles[i] ?? p.preferredPosition ?? '?',
      overall: computeOverall(p),
      cardImage: p.cardImage ?? p.image ?? '',
      x: positions[p._id ?? p.id]?.x ?? 50,
      y: positions[p._id ?? p.id]?.y ?? 50,
      offOvr: toNum(p.offensiveOverall ?? p.offensive),
      defOvr: toNum(p.defensiveOverall ?? p.defensive),
      athOvr: toNum(p.athleticismOverall ?? p.athleticism),
      stamOvr: toNum(p.stamina),
    }));

  const applyFormation = () => {
    const set = getFormationSet(playerCount);
    const chosenA = set.find(f => f.name === formationA) ?? set[0];
    const chosenB = set.find(f => f.name === formationB) ?? set[0];

    // Smart stat-based assignment
    const orderedLeft  = smartAssign(leftPlayers, chosenA.slots);
    const orderedRight = smartAssign(rightPlayers, chosenB.slots);

    setLeftPlayers(orderedLeft);
    setRightPlayers(orderedRight);
    setRoleOverridesA({});
    setRoleOverridesB({});

    const newPosA: Record<string, { x: number; y: number }> = {};
    const newPosB: Record<string, { x: number; y: number }> = {};
    orderedLeft.forEach((p, i) => {
      const slot = chosenA.slots[i] ?? { x: 50, y: 50 };
      newPosA[p._id ?? p.id] = { x: slot.x, y: slot.y };
    });
    orderedRight.forEach((p, i) => {
      const slot = chosenB.slots[i] ?? { x: 50, y: 50 };
      // Mirror y for Team B (GK at top, forwards at bottom on their pitch)
      newPosB[p._id ?? p.id] = { x: slot.x, y: 100 - slot.y };
    });
    setPositionsA(newPosA);
    setPositionsB(newPosB);
    setPitchMode(true);
    setSavedMatchId(null);
  };

  const handleMoveA = (id: string, x: number, y: number) =>
    setPositionsA(prev => ({ ...prev, [id]: { x, y } }));
  const handleMoveB = (id: string, x: number, y: number) =>
    setPositionsB(prev => ({ ...prev, [id]: { x, y } }));

  // Swap a player between teams at the same slot index
  const handleChangeTeam = (playerId: string, fromTeam: 'A' | 'B') => {
    const srcList = fromTeam === 'A' ? leftPlayers  : rightPlayers;
    const dstList = fromTeam === 'A' ? rightPlayers : leftPlayers;
    const idx = srcList.findIndex(p => (p._id ?? p.id) === playerId);
    if (idx === -1 || idx >= dstList.length) return;

    const newSrc = [...srcList];
    const newDst = [...dstList];
    [newSrc[idx], newDst[idx]] = [newDst[idx], newSrc[idx]];

    if (fromTeam === 'A') { setLeftPlayers(newSrc); setRightPlayers(newDst); }
    else                   { setRightPlayers(newSrc); setLeftPlayers(newDst); }

    // Swap their pitch positions too
    const idA = srcList[idx]._id ?? srcList[idx].id;
    const idB = dstList[idx]._id ?? dstList[idx].id;
    const posA = positionsA[idA];
    const posB = positionsB[idB];
    if (posA) setPositionsB(prev => ({ ...prev, [idA]: posB ?? posA }));
    if (posB) setPositionsA(prev => ({ ...prev, [idB]: posA ?? posB }));

    setSavedMatchId(null);
  };

  const handleChangeRole = (playerId: string, newRole: string, team: 'A' | 'B') => {
    if (team === 'A') setRoleOverridesA(prev => ({ ...prev, [playerId]: newRole }));
    else              setRoleOverridesB(prev => ({ ...prev, [playerId]: newRole }));
    setSavedMatchId(null);
  };

  const buildTeamPayload = (
    players: any[],
    positions: Record<string, { x: number; y: number }>,
    slotRoles: string[],
    roleOverrides: Record<string, string>,
    formation: string,
    isTeamB: boolean,
  ) => ({
    formation,
    ovr: computeTeamOvr(players),
    staminaOvr: computeTeamStaminaOvr(players),
    players: players.map((p, i) => ({
      name: p.name ?? 'Unknown',
      email: p.email,
      preferredPosition: p.preferredPosition,
      role: roleOverrides[p._id ?? p.id] ?? slotRoles[i] ?? p.preferredPosition ?? '?',
      x: positions[p._id ?? p.id]?.x ?? 50,
      y: isTeamB
        ? (positions[p._id ?? p.id]?.y ?? 50)
        : (positions[p._id ?? p.id]?.y ?? 50),
    })),
  });

  const formationSet = getFormationSet(playerCount);
  const chosenFormationA = formationSet.find(f => f.name === formationA) ?? formationSet[0];
  const chosenFormationB = formationSet.find(f => f.name === formationB) ?? formationSet[0];
  const rolesA = chosenFormationA?.slots.map(s => s.role) ?? [];
  const rolesB = chosenFormationB?.slots.map(s => s.role) ?? [];
  const allRolesA = [...new Set(rolesA)];
  const allRolesB = [...new Set(rolesB)];

  const handleSave = async () => {
    if (!pitchMode) return;
    try {
      const teamA = buildTeamPayload(leftPlayers, positionsA, rolesA, roleOverridesA, chosenFormationA?.name ?? '', false);
      const teamB = buildTeamPayload(rightPlayers, positionsB, rolesB, roleOverridesB, chosenFormationB?.name ?? '', true);
      const saved = await apiRequest<{ _id: string }>('/matches', {
        method: 'POST',
        body: JSON.stringify({ teamA, teamB }),
      });
      setSavedMatchId(saved._id);
      showToastMsg('Match saved!');
    } catch (err: any) {
      showToastMsg('Failed to save: ' + err.message, 'danger');
    }
  };

  const handleAnnounce = async (details: { location: string; date: string; time: string }) => {
    const teamA = buildTeamPayload(leftPlayers, positionsA, rolesA, roleOverridesA, chosenFormationA?.name ?? '', false);
    const teamB = buildTeamPayload(rightPlayers, positionsB, rolesB, roleOverridesB, chosenFormationB?.name ?? '', true);
    try {
      // Save first if not yet saved
      let matchId = savedMatchId;
      if (!matchId) {
        const saved = await apiRequest<{ _id: string }>('/matches', {
          method: 'POST',
          body: JSON.stringify({ teamA, teamB }),
        });
        matchId = saved._id;
        setSavedMatchId(matchId);
      }
      // Then announce (sends emails + marks announced)
      const result = await apiRequest<{ sent: any[] }>(`/matches/${matchId}/announce`, {
        method: 'POST',
        body: JSON.stringify(details),
      });
      showToastMsg('Announced & saved! Emails sent to ' + result.sent.length + ' player(s).');
    } catch (err: any) {
      showToastMsg('Failed: ' + err.message, 'danger');
    }
    setShowMatchModal(false);
  };

  return (
    <div className="page-wrapper">
      <div className="match-page-container">
        <ToastNotification show={showToast} message={toastMsg} onClose={() => setShowToast(false)} variant={toastVariant} />

        {showMatchModal && (
          <MatchDetailsModal
            leftTeam={leftPlayers.map(p => ({ name: p.name ?? 'Unknown', email: p.email, preferredPosition: p.preferredPosition }))}
            rightTeam={rightPlayers.map(p => ({ name: p.name ?? 'Unknown', email: p.email, preferredPosition: p.preferredPosition }))}
            onSkip={() => setShowMatchModal(false)}
            onAnnounce={handleAnnounce}
          />
        )}

        <div className="match-layout">
          {/* ── Sidebar ── */}
          <aside className="match-sidebar">
            <div className="match-sidebar__back">
              <BackButton position="static" />
            </div>
            <h1 className="match-title">Match Lineup &<br />Formation Builder</h1>

            <div className="match-settings-card">
              <h2 className="match-settings-card__header">
                <span className="match-settings-card__dot" />
                Match Settings
              </h2>

              <div className="match-setting-group">
                <label className="match-setting-label">Number of Players</label>
                <select className="match-setting-select" value={playerCount} onChange={e => setPlayerCount(Number(e.target.value))}>
                  {PLAYER_COUNT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="match-setting-group">
                <label className="match-setting-label">Team A Formation</label>
                <select className="match-setting-select" value={formationA} onChange={e => setFormationA(e.target.value)}>
                  {formationSet.map(f => <option key={f.name} value={f.name}>{f.name.toUpperCase()}</option>)}
                </select>
              </div>

              <div className="match-setting-group">
                <label className="match-setting-label">Team B Formation</label>
                <select className="match-setting-select" value={formationB} onChange={e => setFormationB(e.target.value)}>
                  {formationSet.map(f => <option key={f.name} value={f.name}>{f.name.toUpperCase()}</option>)}
                </select>
              </div>

              <button className="match-apply-btn" onClick={applyFormation} disabled={leftPlayers.length === 0}>
                Apply Formation
              </button>
            </div>

            {playersPool.length > 0 && (
              <div className="match-crew-panel">
                <div className="match-crew-header">
                  <span><i className="bi bi-people-fill me-1" />Players</span>
                  <span className="match-crew-count">{selectedPlayerIds.size} / {playersPool.length}</span>
                  <div className="match-crew-actions">
                    <button type="button" onClick={() => setSelectedPlayerIds(new Set(playersPool.map((p: any) => p._id)))}>All</button>
                    <button type="button" onClick={() => setSelectedPlayerIds(new Set())}>None</button>
                  </div>
                </div>
                <div className="crew-chips">
                  {playersPool.map((p: any) => {
                    const sel = selectedPlayerIds.has(p._id);
                    return (
                      <button
                        key={p._id}
                        type="button"
                        className={'crew-chip ' + (sel ? 'crew-chip--selected' : '')}
                        onClick={() => setSelectedPlayerIds(prev => { const next = new Set(prev); sel ? next.delete(p._id) : next.add(p._id); return next; })}
                      >
                        {sel && <i className="bi bi-check-circle-fill me-1" style={{ fontSize: '0.75rem' }} />}
                        {p.name}<span className="crew-chip__pos">{p.preferredPosition ?? '?'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>

          {/* ── Main area ── */}
          <div className="match-main">
            {pitchMode ? (
              <>
                <div className="match-pitches-row">
                  <FootballPitch
                    players={toPitchPlayers(leftPlayers, positionsA, rolesA, roleOverridesA)}
                    teamLabel="A"
                    teamOvr={computeTeamOvr(leftPlayers)}
                    teamStaminaOvr={computeTeamStaminaOvr(leftPlayers)}
                    formationRoles={allRolesA}
                    onMove={handleMoveA}
                    onChangeTeam={id => handleChangeTeam(id, 'A')}
                    onChangeRole={(id, role) => handleChangeRole(id, role, 'A')}
                  />
                  <FootballPitch
                    players={toPitchPlayers(rightPlayers, positionsB, rolesB, roleOverridesB)}
                    teamLabel="B"
                    teamOvr={computeTeamOvr(rightPlayers)}
                    teamStaminaOvr={computeTeamStaminaOvr(rightPlayers)}
                    isTeamB
                    formationRoles={allRolesB}
                    onMove={handleMoveB}
                    onChangeTeam={id => handleChangeTeam(id, 'B')}
                    onChangeRole={(id, role) => handleChangeRole(id, role, 'B')}
                  />
                </div>

                <div className="match-pitch-footer">
                  <p className="match-pitch-footer__hint">
                    Drag players to reposition. Right-click a card to change team or role.
                  </p>
                  <div className="match-pitch-footer__actions">
                    <button className="fp-btn fp-btn--save" onClick={handleSave}>
                      {savedMatchId ? <><i className="bi bi-check2 me-1" />Saved</> : <><i className="bi bi-floppy me-1" />Save</>}
                    </button>
                    <button className="fp-btn fp-btn--accent" onClick={() => setShowMatchModal(true)}>
                      ANNOUNCE MATCH
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="match-pitch-placeholder">
                <i className="bi bi-diagram-3" />
                <p>Pick formations and click <strong>Apply Formation</strong> to see the lineup on the pitch.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchPage;

import { useState, useEffect, useMemo } from 'react';
import BackButton from '../components/BackButton';
import Dropdown from '../components/Dropdown';
import FootballPitch, { PitchPlayer } from '../components/FootballPitch';
import MatchDetailsModal from '../components/MatchDetailsModal';
import ToastNotification from '../components/ToastNotification';
import { usePlayers } from '../contexts/PlayerContext';
import { usePlayerDisplay } from '../hooks/usePlayerDisplay';
import { apiRequest } from '../services/api/apiClient';
import './MatchPage.css';
import '../components/MatchDetailsModal.css';
import { PLAYER_COUNT_OPTIONS, getFormationSet, smartAssign } from '../data/formations';

interface CrewOption {
  _id: string;
  name: string;
  playerIds: string[];
  players?: any[];
}

const MatchPage = () => {
  const { players } = usePlayers();
  const { getPlayerCardImage } = usePlayerDisplay();
  const [crews, setCrews] = useState<CrewOption[]>([]);
  const [selectedCrewId, setSelectedCrewId] = useState('');
  const [playersPool, setPlayersPool]    = useState<any[]>([]);
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
  const benchPlayers = useMemo(() => {
    const assignedIds = new Set([...leftPlayers, ...rightPlayers].map(p => p._id ?? p.id));
    return playersPool.filter(p => !assignedIds.has(p._id ?? p.id));
  }, [playersPool, leftPlayers, rightPlayers]);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);
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

  const isGoalkeeper = (p: any, role?: string): boolean =>
    String(role ?? p.preferredPosition ?? '').toUpperCase().includes('GK');

  const computeOverall = (p: any, role?: string): number => {
    const gkOverall = toNum(p.gkOverall);
    if (isGoalkeeper(p, role) && gkOverall > 0) return gkOverall;

    const v1 = toNum(p.offensiveOverall ?? p.offensive);
    const v2 = toNum(p.defensiveOverall ?? p.defensive);
    const v3 = toNum(p.athleticismOverall ?? p.athleticism);
    const parts = [v1, v2, v3].filter(x => x > 0);
    return (v1 + v2 + v3) / (parts.length || 3);
  };

  const mergePlayers = (items: any[]): any[] => {
    const map = new Map<string, any>();
    items.forEach(player => {
      const id = player?._id ?? player?.id;
      if (id) map.set(id, player);
    });
    return [...map.values()];
  };

  const getCrewPlayers = (crew: CrewOption): any[] => {
    const embeddedPlayers = crew.players ?? [];
    const localCrewPlayers = players.filter(player => crew.playerIds.includes(player._id));
    return mergePlayers([...embeddedPlayers, ...localCrewPlayers]);
  };

  useEffect(() => {
    apiRequest<CrewOption[]>('/crews')
      .then(setCrews)
      .catch(() => showToastMsg('Failed to load crews.', 'danger'));
  }, []);

  useEffect(() => {
    const crewPlayers = crews.flatMap(crew => crew.players ?? []);
    const allPlayers = mergePlayers([...players, ...crewPlayers]);
    const selectedCrew = crews.find(crew => crew._id === selectedCrewId);
    const nextPool = selectedCrew
      ? getCrewPlayers(selectedCrew)
      : selectedCrewId === 'ALL'
        ? allPlayers
        : [];
    setPlayersPool(nextPool);
  }, [players, crews, selectedCrewId]);

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
    players.map((p, i) => {
      const id = p._id ?? p.id ?? '';
      const role = roleOverrides[id] ?? slotRoles[i] ?? p.preferredPosition ?? '?';
      return {
        id,
        name: p.name ?? 'Unknown',
        role,
        overall: computeOverall(p, role),
        cardImage: getPlayerCardImage(p),
        x: positions[id]?.x ?? 50,
        y: positions[id]?.y ?? 50,
        offOvr: toNum(p.offensiveOverall ?? p.offensive),
        defOvr: toNum(p.defensiveOverall ?? p.defensive),
        athOvr: toNum(p.athleticismOverall ?? p.athleticism),
        stamOvr: toNum(p.stamina),
      };
    });

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
  const handleBench = (playerId: string, fromTeam: 'A' | 'B') => {
    const srcList = fromTeam === 'A' ? leftPlayers : rightPlayers;
    const player = srcList.find(p => (p._id ?? p.id) === playerId);
    if (!player) return;

    if (fromTeam === 'A') {
      setLeftPlayers(prev => prev.filter(p => (p._id ?? p.id) !== playerId));
      setPositionsA(prev => { const next = { ...prev }; delete next[playerId]; return next; });
    } else {
      setRightPlayers(prev => prev.filter(p => (p._id ?? p.id) !== playerId));
      setPositionsB(prev => { const next = { ...prev }; delete next[playerId]; return next; });
    }
    setSavedMatchId(null);
  };

  const handleAddFromBench = (playerId: string, toTeam: 'A' | 'B') => {
    const player = benchPlayers.find(p => (p._id ?? p.id) === playerId);
    if (!player) return;
    if (toTeam === 'A') setLeftPlayers(prev => [...prev, player]);
    else setRightPlayers(prev => [...prev, player]);
    setSavedMatchId(null);
  };

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

  const renderFormationBuilder = () => (
    <div className="match-settings-card match-settings-card--builder">
      <h2 className="match-settings-card__header">
        <span className="match-settings-card__dot" />
        Formation Builder
      </h2>

      <div className="match-setting-group">
        <label className="match-setting-label">Crew</label>
        <Dropdown
          value={selectedCrewId}
          onChange={setSelectedCrewId}
          ariaLabel="Crew"
          options={[
            { value: '', label: 'Select Crew' },
            { value: 'ALL', label: 'All Players' },
            ...crews.map(crew => ({
              value: crew._id,
              label: `${crew.name.toUpperCase()} (${getCrewPlayers(crew).length})`,
            })),
          ]}
        />
      </div>

      <div className="match-setting-group">
        <label className="match-setting-label">Number of Players</label>
        <Dropdown
          value={String(playerCount)}
          onChange={v => setPlayerCount(Number(v))}
          ariaLabel="Number of Players"
          options={PLAYER_COUNT_OPTIONS.map(o => ({ value: String(o.value), label: o.label }))}
        />
      </div>

      <div className="match-setting-group">
        <label className="match-setting-label">Team A Formation</label>
        <Dropdown
          value={formationA}
          onChange={setFormationA}
          ariaLabel="Team A Formation"
          options={formationSet.map(f => ({ value: f.name, label: f.name.toUpperCase() }))}
        />
      </div>

      <div className="match-setting-group">
        <label className="match-setting-label">Team B Formation</label>
        <Dropdown
          value={formationB}
          onChange={setFormationB}
          ariaLabel="Team B Formation"
          options={formationSet.map(f => ({ value: f.name, label: f.name.toUpperCase() }))}
        />
      </div>

      <button className="match-apply-btn" onClick={applyFormation} disabled={leftPlayers.length === 0}>
        Apply Formation
      </button>
    </div>
  );

  const renderBench = () => (
    <div className="match-bench-panel">
      <div className="match-bench-header">
        <i className="bi bi-person-dash" />
        Bench
        {benchPlayers.length > 0 && (
          <span className="match-bench-count">{benchPlayers.length}</span>
        )}
      </div>
      {benchPlayers.length === 0 ? (
        <p className="match-bench-empty">No players on bench</p>
      ) : (
        <div className="match-bench-list">
          {benchPlayers.map(player => {
            const id = player._id ?? player.id;
            return (
              <div key={id} className="match-bench-row">
                <div className="match-bench-info">
                  <span className="match-bench-name">{player.name ?? 'Unknown'}</span>
                  <span className="match-bench-pos">{player.preferredPosition ?? '?'}</span>
                </div>
                <button
                  type="button"
                  className="match-bench-btn match-bench-btn--a"
                  onClick={() => handleAddFromBench(id, 'A')}
                  title="Add to Team A"
                >A</button>
                <button
                  type="button"
                  className="match-bench-btn match-bench-btn--b"
                  onClick={() => handleAddFromBench(id, 'B')}
                  title="Add to Team B"
                >B</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderTeamRoster = (
    team: 'A' | 'B',
    teamPlayers: any[],
    slotRoles: string[],
    roleOverrides: Record<string, string>,
    roles: string[],
  ) => (
    <div className={`match-team-roster match-team-roster--${team.toLowerCase()}`}>
      <div className="match-team-roster__header">
        <span>Team {team} List</span>
        <span>{teamPlayers.length}</span>
      </div>
      <div className="match-team-roster__list">
        {teamPlayers.map((player, index) => {
          const id = player._id ?? player.id;
          const role = roleOverrides[id] ?? slotRoles[index] ?? player.preferredPosition ?? '?';
          return (
            <div key={id} className="match-team-roster__row">
              <div className="match-team-roster__player">
                <span className="match-team-roster__name">{player.name ?? 'Unknown'}</span>
                <span className="match-team-roster__pos">{player.preferredPosition ?? '?'}</span>
              </div>
              <select
                className="match-team-roster__role"
                value={role}
                onChange={e => handleChangeRole(id, e.target.value, team)}
                aria-label={`Change ${player.name ?? 'player'} role`}
              >
                {[...new Set([role, ...roles])].map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <button
                type="button"
                className="match-team-roster__swap"
                onClick={() => handleChangeTeam(id, team)}
                title={`Move to Team ${team === 'A' ? 'B' : 'A'}`}
              >
                <i className="bi bi-arrow-left-right" />
              </button>
              <button
                type="button"
                className="match-team-roster__bench"
                onClick={() => handleBench(id, team)}
                title="Send to bench"
              >
                <i className="bi bi-person-dash" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="page-container match-page-container">
        <div className="content-card match-content-card">
        <ToastNotification show={showToast} message={toastMsg} onClose={() => setShowToast(false)} variant={toastVariant} />

        {showIncompleteWarning && (
          <div className="mdm-backdrop">
            <div className="mdm-panel" role="dialog" aria-modal="true">
              <div className="mdm-header">
                <i className="bi bi-exclamation-triangle" style={{ color: '#f0ad4e' }} />
                <h3>Incomplete Teams</h3>
              </div>
              <p className="mdm-subtitle">
                Your lineup has <strong className="mdm-accent">{leftPlayers.length + rightPlayers.length}</strong> players,
                but a {playerCount}v{playerCount} match expects <strong className="mdm-accent">{playerCount * 2}</strong>.
                Team A has <strong className="mdm-accent">{leftPlayers.length}</strong> and Team B has <strong className="mdm-accent">{rightPlayers.length}</strong>.
              </p>
              <p className="mdm-subtitle">Do you still want to announce this match with incomplete teams?</p>
              <div className="mdm-actions">
                <button
                  type="button"
                  className="btn btn-ct active-mode"
                  onClick={() => setShowIncompleteWarning(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-ct"
                  onClick={() => { setShowIncompleteWarning(false); setShowMatchModal(true); }}
                >
                  <i className="bi bi-send-fill" />
                  Announce Anyway
                </button>
              </div>
            </div>
          </div>
        )}

        {showMatchModal && (
          <MatchDetailsModal
            leftTeam={leftPlayers.map(p => ({ name: p.name ?? 'Unknown', email: p.email, preferredPosition: p.preferredPosition }))}
            rightTeam={rightPlayers.map(p => ({ name: p.name ?? 'Unknown', email: p.email, preferredPosition: p.preferredPosition }))}
            onSkip={() => setShowMatchModal(false)}
            onAnnounce={handleAnnounce}
          />
        )}

        <div className="page-header match-page-header">
          <div className="back-button-container">
            <BackButton position="static" />
          </div>
          <h2 className="page-title match-page-title">Match Lineup</h2>
          <div className="match-page-actions">
            {pitchMode && (
              <>
                <button className="fp-btn fp-btn--save" onClick={handleSave}>
                  {savedMatchId ? <><i className="bi bi-check2 me-1" />Saved</> : <><i className="bi bi-floppy me-1" />Save</>}
                </button>
                <button
                  className="fp-btn fp-btn--accent"
                  onClick={() => {
                    const expected = playerCount * 2;
                    const actual = leftPlayers.length + rightPlayers.length;
                    if (actual < expected) {
                      setShowIncompleteWarning(true);
                    } else {
                      setShowMatchModal(true);
                    }
                  }}
                >
                  ANNOUNCE MATCH
                </button>
              </>
            )}
          </div>
        </div>

        <div className="match-layout match-layout--pitch">
          {/* ── Main area ── */}
          <div className="match-main">
            <div className="match-builder-stage">
              <div className="match-team-panel">
                <FootballPitch
                  players={pitchMode ? toPitchPlayers(leftPlayers, positionsA, rolesA, roleOverridesA) : []}
                  teamLabel="A"
                  teamOvr={computeTeamOvr(leftPlayers)}
                  teamStaminaOvr={computeTeamStaminaOvr(leftPlayers)}
                  formationRoles={allRolesA}
                  onMove={handleMoveA}
                  onChangeTeam={id => handleChangeTeam(id, 'A')}
                  onBench={id => handleBench(id, 'A')}
                  onChangeRole={(id, role) => handleChangeRole(id, role, 'A')}
                />
                {pitchMode && renderTeamRoster('A', leftPlayers, rolesA, roleOverridesA, allRolesA)}
              </div>
              <div className="match-center-column">
                {renderFormationBuilder()}
                {renderBench()}
              </div>
              <div className="match-team-panel">
                <FootballPitch
                  players={pitchMode ? toPitchPlayers(rightPlayers, positionsB, rolesB, roleOverridesB) : []}
                  teamLabel="B"
                  teamOvr={computeTeamOvr(rightPlayers)}
                  teamStaminaOvr={computeTeamStaminaOvr(rightPlayers)}
                  isTeamB
                  formationRoles={allRolesB}
                  onMove={handleMoveB}
                  onChangeTeam={id => handleChangeTeam(id, 'B')}
                  onBench={id => handleBench(id, 'B')}
                  onChangeRole={(id, role) => handleChangeRole(id, role, 'B')}
                />
                {pitchMode && renderTeamRoster('B', rightPlayers, rolesB, roleOverridesB, allRolesB)}
              </div>
            </div>
            {pitchMode && <p className="match-pitch-hint">Drag players to reposition. Use the team lists or right-click a card to adjust teams and roles.</p>}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default MatchPage;

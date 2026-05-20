import { useRef, useState, useEffect, useCallback } from 'react';
import './FootballPitch.css';

export interface PitchPlayer {
  id: string;
  name: string;
  role: string;       // formation role label (GK, CB, LW, ST …)
  overall: number;
  cardImage?: string;
  x: number;          // 0–100 percent of pitch width
  y: number;          // 0–100 percent of pitch height
  offOvr: number;
  defOvr: number;
  athOvr: number;
  stamOvr: number;
}

interface ContextMenuState {
  playerId: string;
  playerName: string;
  screenX: number;
  screenY: number;
}

interface FootballPitchProps {
  players: PitchPlayer[];
  teamLabel: string;
  teamOvr: number;
  teamStaminaOvr: number;
  isTeamB?: boolean;
  formationRoles: string[];           // all slot roles available in this team's formation
  readOnly?: boolean;                 // disables drag and context menu (for match previews)
  onMove: (id: string, x: number, y: number) => void;
  onChangeTeam: (playerId: string) => void;
  onChangeRole: (playerId: string, newRole: string) => void;
}

const FootballPitch = ({
  players, teamLabel, teamOvr, teamStaminaOvr,
  isTeamB = false, formationRoles, readOnly = false,
  onMove, onChangeTeam, onChangeRole,
}: FootballPitchProps) => {
  const pitchRef = useRef<HTMLDivElement>(null);
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null);

  // Close context menu on click outside
  const closeCtx = useCallback(() => setCtxMenu(null), []);
  useEffect(() => {
    if (!ctxMenu) return;
    document.addEventListener('click', closeCtx);
    document.addEventListener('contextmenu', closeCtx);
    return () => {
      document.removeEventListener('click', closeCtx);
      document.removeEventListener('contextmenu', closeCtx);
    };
  }, [ctxMenu, closeCtx]);

  const getPercent = (clientX: number, clientY: number) => {
    const rect = pitchRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(5, Math.min(95, ((clientY - rect.top) / rect.height) * 100)),
    };
  };

  const renderCard = (player: PitchPlayer) => (
    <div
      key={player.id}
      className={`pitch-card pitch-card--${isTeamB ? 'b' : 'a'}`}
      style={{ left: `${player.x}%`, top: `${player.y}%` }}
      onContextMenu={(e) => {
        if (readOnly) return;
        e.preventDefault();
        e.stopPropagation();
        setCtxMenu({ playerId: player.id, playerName: player.name, screenX: e.clientX, screenY: e.clientY });
      }}
      onPointerDown={(e) => {
        if (readOnly || e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        (e.currentTarget as HTMLElement).style.zIndex = '100';
      }}
      onPointerMove={(e) => {
        if (readOnly || e.buttons !== 1) return;
        const { x, y } = getPercent(e.clientX, e.clientY);
        onMove(player.id, x, y);
      }}
      onPointerUp={(e) => {
        e.currentTarget.releasePointerCapture(e.pointerId);
        (e.currentTarget as HTMLElement).style.zIndex = '';
      }}
    >
      <div className="pitch-card__top">
        <span className="pitch-card__ovr">{Math.round(player.overall)}</span>
        <span className="pitch-card__role">{player.role}</span>
      </div>
      <div className="pitch-card__photo">
        {player.cardImage
          ? <img src={player.cardImage} alt={player.name} draggable={false} />
          : <span className="pitch-card__initial">{(player.name || '?')[0].toUpperCase()}</span>
        }
      </div>
      <div className="pitch-card__name">{player.name}</div>
      <div className="pitch-card__stats">
        <span>{Math.round(player.offOvr)} OFF</span>
        <span>{Math.round(player.defOvr)} DEF</span>
        <span>{Math.round(player.athOvr)} ATH</span>
      </div>
    </div>
  );

  return (
    <div className="fp-wrapper">
      {/* Team header */}
      <div className={`fp-team-header fp-team-header--${isTeamB ? 'b' : 'a'}`}>
        <span className="fp-team-label">Team {teamLabel}</span>
        <div className="fp-team-stats">
          <div className="fp-stat-chip">
            <span className="fp-stat-chip__val">{teamOvr || '—'}</span>
            <span className="fp-stat-chip__lbl">OVR</span>
          </div>
          <div className="fp-stat-chip fp-stat-chip--stam">
            <span className="fp-stat-chip__val">{teamStaminaOvr || '—'}</span>
            <span className="fp-stat-chip__lbl">STAM</span>
          </div>
        </div>
      </div>

      {/* Vertical pitch */}
      <div className="fp-pitch" ref={pitchRef}>
        <div className="fp-m fp-m-stripes" />
        <div className="fp-m fp-m-border" />
        <div className="fp-m fp-m-center-line" />
        <div className="fp-m fp-m-center-circle" />
        <div className="fp-m fp-m-center-dot" />
        <div className="fp-m fp-m-penalty-top" />
        <div className="fp-m fp-m-penalty-bottom" />
        <div className="fp-m fp-m-goal-top" />
        <div className="fp-m fp-m-goal-bottom" />
        {players.map(renderCard)}

        {/* Context menu — rendered inside the pitch so it stays on screen */}
        {ctxMenu && !readOnly && (
          <div
            className="fp-ctx-menu"
            style={{
              position: 'fixed',
              top: ctxMenu.screenY,
              left: ctxMenu.screenX,
              zIndex: 999,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fp-ctx-menu__title">{ctxMenu.playerName}</div>

            <div className="fp-ctx-menu__section-label">Move to</div>
            <button
              className="fp-ctx-menu__item fp-ctx-menu__item--team"
              onClick={() => { onChangeTeam(ctxMenu.playerId); setCtxMenu(null); }}
            >
              <i className="bi bi-arrow-left-right" />
              Team {isTeamB ? 'A' : 'B'}
            </button>

            <div className="fp-ctx-menu__section-label">Change role</div>
            {formationRoles.map(role => (
              <button
                key={role}
                className="fp-ctx-menu__item"
                onClick={() => { onChangeRole(ctxMenu.playerId, role); setCtxMenu(null); }}
              >
                {role}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FootballPitch;

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Card from '../components/Card';
import { usePlayers } from '../contexts/PlayerContext';
import { useAuth } from '../contexts/AuthContext';
import { usePlayerDisplay } from '../hooks/usePlayerDisplay';
import { apiRequest } from '../services/api/apiClient';
import type { Player } from '../services/api/types';
import './PreviewPage.css';

const POSITION_GROUPS = [
  { key: 'gk',  label: 'Goalkeepers', icon: 'bi-person-fill',     positions: ['GK'] },
  { key: 'def', label: 'Defenders',   icon: 'bi-shield-fill',      positions: ['CB', 'LB', 'RB', 'LWB', 'RWB', 'SW', 'WB'] },
  { key: 'mid', label: 'Midfielders', icon: 'bi-arrow-left-right', positions: ['CM', 'CDM', 'CAM', 'LM', 'RM', 'DM', 'AM'] },
  { key: 'att', label: 'Attackers',   icon: 'bi-lightning-fill',   positions: ['ST', 'CF', 'LW', 'RW', 'SS', 'FW', 'LS', 'RS'] },
];

interface VisibleCrew {
  _id: string;
  name: string;
  ownerUid: string;
  playerIds: string[];
  editorUids?: string[];
  players?: Player[];
}

const PreviewPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { players, loading } = usePlayers();
  const { getPlayerCardImage } = usePlayerDisplay();
  const [crews, setCrews] = useState<VisibleCrew[]>([]);
  const [crewsLoading, setCrewsLoading] = useState(true);
  const [selectedCrewId, setSelectedCrewId] = useState('');

  useEffect(() => {
    apiRequest<VisibleCrew[]>('/crews')
      .then(setCrews)
      .catch(() => setCrews([]))
      .finally(() => setCrewsLoading(false));
  }, []);

  const ownedCrews = useMemo(
    () => crews.filter(crew => crew.ownerUid === currentUser?.uid),
    [crews, currentUser]
  );

  const sharedCrews = useMemo(
    () => crews.filter(crew => crew.ownerUid !== currentUser?.uid),
    [crews, currentUser]
  );

  const visiblePlayers = useMemo(() => {
    const selectedCrew = crews.find(crew => crew._id === selectedCrewId);
    if (selectedCrew) return selectedCrew.players ?? [];

    const map = new Map<string, Player>();
    players.forEach(player => map.set(player._id, player));

    if (ownedCrews.length === 0) {
      sharedCrews.flatMap(crew => crew.players ?? []).forEach(player => {
        if (player?._id && !map.has(player._id)) map.set(player._id, player);
      });
    }

    return [...map.values()];
  }, [players, crews, ownedCrews.length, sharedCrews, selectedCrewId]);

  const editablePlayerIds = useMemo(() => {
    const ids = new Set(players.map(player => player._id));
    crews.forEach(crew => {
      const canEditCrew = crew.ownerUid === currentUser?.uid || (crew.editorUids ?? []).includes(currentUser?.uid ?? '');
      if (canEditCrew) crew.playerIds.forEach(id => ids.add(id));
    });
    return ids;
  }, [players, crews, currentUser]);

  const isLoading = loading || crewsLoading;

  const sections = POSITION_GROUPS.map(group => ({
    ...group,
    players: visiblePlayers.filter(p =>
      group.positions.includes((p.preferredPosition ?? '').toUpperCase())
    ),
  })).filter(s => s.players.length > 0);

  const ungrouped = visiblePlayers.filter(p => {
    const pos = (p.preferredPosition ?? '').toUpperCase();
    return !POSITION_GROUPS.some(g => g.positions.includes(pos));
  });

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="content-card">
          <div className="page-header preview-page__header">
            <div className="back-button-container">
              <BackButton position="static" />
            </div>
            <h2 className="page-title">Player Roster</h2>
            <div className="page-header-spacer" />
          </div>

          {ownedCrews.length > 0 && (
            <div className="preview-filter">
              <label className="preview-filter__label" htmlFor="previewCrewFilter">Roster Scope</label>
              <select
                id="previewCrewFilter"
                className="preview-filter__select"
                value={selectedCrewId}
                onChange={event => setSelectedCrewId(event.target.value)}
              >
                <option value="">All Players ({players.length})</option>
                {ownedCrews.map(crew => (
                  <option key={crew._id} value={crew._id}>
                    {crew.name} ({crew.players?.length ?? 0})
                  </option>
                ))}
              </select>
            </div>
          )}

          {isLoading && <p className="empty-message">Loading players...</p>}

          {!isLoading && visiblePlayers.length === 0 && (
            <p className="empty-message">No players found.</p>
          )}

          {!isLoading && visiblePlayers.length > 0 && (
            <div className="preview-sections">
              {sections.map(section => (
                <div key={section.key} className="preview-section">
                  <div className="preview-section__header">
                    <i className={`bi ${section.icon} preview-section__icon`}></i>
                    <span className="preview-section__label">{section.label}</span>
                    <span className="preview-section__count">{section.players.length}</span>
                  </div>
                  <div className="preview-grid">
                    {section.players.map((player, idx) => (
                      <div
                        key={player._id}
                        className="preview-card-wrapper"
                        style={{ animationDelay: `${idx * 0.06}s` }}
                      >
                        <Card
                          _id={player._id}
                          name={player.name}
                          preferredPosition={player.preferredPosition}
                          offensiveOverall={player.offensiveOverall}
                          defensiveOverall={player.defensiveOverall}
                          athleticismOverall={player.athleticismOverall}
                          gkOverall={player.gkOverall}
                          reflexes={player.reflexes}
                          handling={player.handling}
                          diving={player.diving}
                          cardImage={getPlayerCardImage(player)}
                          cardTitle={player.cardTitle}
                          editMode={editablePlayerIds.has(player._id)}
                          onEdit={() => navigate(`/edit-player/${player._id}`)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {ungrouped.length > 0 && (
                <div className="preview-section">
                  <div className="preview-section__header">
                    <i className="bi bi-person-fill preview-section__icon"></i>
                    <span className="preview-section__label">Other</span>
                    <span className="preview-section__count">{ungrouped.length}</span>
                  </div>
                  <div className="preview-grid">
                    {ungrouped.map((player, idx) => (
                      <div
                        key={player._id}
                        className="preview-card-wrapper"
                        style={{ animationDelay: `${idx * 0.06}s` }}
                      >
                        <Card
                          _id={player._id}
                          name={player.name}
                          preferredPosition={player.preferredPosition}
                          offensiveOverall={player.offensiveOverall}
                          defensiveOverall={player.defensiveOverall}
                          athleticismOverall={player.athleticismOverall}
                          gkOverall={player.gkOverall}
                          reflexes={player.reflexes}
                          handling={player.handling}
                          diving={player.diving}
                          cardImage={getPlayerCardImage(player)}
                          cardTitle={player.cardTitle}
                          editMode={editablePlayerIds.has(player._id)}
                          onEdit={() => navigate(`/edit-player/${player._id}`)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewPage;
  

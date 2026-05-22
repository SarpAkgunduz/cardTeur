import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePlayers } from '../contexts/PlayerContext';
import BackButton from '../components/BackButton';
import type { Player } from '../services/api/types';
import { apiRequest } from '../services/api/apiClient';
import ToastNotification from '../components/ToastNotification';
import { usePlayerDisplay } from '../hooks/usePlayerDisplay';
import './CrewPage.css';

interface Crew {
  _id: string;
  ownerUid: string;
  name: string;
  playerIds: string[];
  memberUids: string[];
  editorUids: string[];
  players?: Player[];
}

interface LinkedUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

const CrewPage = () => {
  const { currentUser } = useAuth();
  const { players, loading: playersLoading, updatePlayer } = usePlayers();
  const { getPlayerCardImage } = usePlayerDisplay();
  const [crews, setCrews] = useState<Crew[]>([]);
  const [linkedUserMap, setLinkedUserMap] = useState<Record<string, LinkedUser>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'crews' | 'permissions'>('crews');

  const [creatingCrew, setCreatingCrew] = useState(false);
  const [newCrewName, setNewCrewName] = useState('');
  const [editingCrewId, setEditingCrewId] = useState<string | null>(null);
  const [editingCrewName, setEditingCrewName] = useState('');
  const [addingPlayerToCrewId, setAddingPlayerToCrewId] = useState<string | null>(null);

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [addedAnimation, setAddedAnimation] = useState<Record<string, boolean>>({});
  const [renameShimmer, setRenameShimmer] = useState(false);

  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState('');
  const [savingEmailId, setSavingEmailId] = useState<string | null>(null);
  const [savingPermission, setSavingPermission] = useState<string | null>(null);

  const [toastMsg, setToastMsg] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'danger'>('success');
  const [showToast, setShowToast] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const newCrewInputRef = useRef<HTMLInputElement>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMsg = (msg: string, variant: 'success' | 'danger' = 'success') => {
    setToastMsg(msg); setToastVariant(variant); setShowToast(true);
  };

  const flashSaved = () => {
    setSavedFlash(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSavedFlash(false), 2000);
  };

  useEffect(() => {
    apiRequest<Crew[]>('/crews')
      .then((loadedCrews) => {
        setCrews(loadedCrews);
      })
      .catch(() => showMsg('Failed to load crews.', 'danger'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const linkedUids = [...new Set([
      ...(players.map(p => p.linkedUserId).filter(Boolean) as string[]),
      ...crews.flatMap(crew => [...(crew.memberUids ?? []), ...(crew.editorUids ?? [])]),
    ])];
    if (linkedUids.length === 0) {
      setLinkedUserMap({});
      return;
    }

    apiRequest<LinkedUser[]>('/users/lookup-by-uids', {
      method: 'POST',
      body: JSON.stringify({ uids: linkedUids }),
    })
      .then(async (users) => {
        const map: Record<string, LinkedUser> = {};
        users.forEach(u => { map[u.uid] = u; });
        setLinkedUserMap(map);

        for (const player of players) {
          if (player.linkedUserId && !player.email && map[player.linkedUserId]?.email) {
            try {
              await updatePlayer(player._id, { email: map[player.linkedUserId].email });
            } catch { /* non-fatal */ }
          }
        }
      })
      .catch(() => {});
  }, [players, crews, updatePlayer]);

  const handleCreateCrew = async () => {
    if (!newCrewName.trim()) return;
    try {
      const crew = await apiRequest<Crew>('/crews', {
        method: 'POST',
        body: JSON.stringify({ name: newCrewName.trim() }),
      });
      setCrews(prev => [...prev, crew]);
      setNewCrewName('');
      setCreatingCrew(false);
      flashSaved();
    } catch { showMsg('Failed to create crew.', 'danger'); }
  };

  const handleRenameCrew = async (id: string) => {
    if (!editingCrewName.trim()) return;
    try {
      const updated = await apiRequest<Crew>(`/crews/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editingCrewName.trim() }),
      });
      setCrews(prev => prev.map(c => c._id === id ? updated : c));
      setEditingCrewId(null);
      flashSaved();
    } catch { showMsg('Failed to rename crew.', 'danger'); }
  };

  const handleDeleteCrew = async (id: string) => {
    try {
      await apiRequest(`/crews/${id}`, { method: 'DELETE' });
      setCrews(prev => prev.filter(c => c._id !== id));
      flashSaved();
    } catch { showMsg('Failed to delete crew.', 'danger'); }
  };

  const handleAddPlayerToCrew = async (crewId: string, playerId: string) => {
    try {
      const updated = await apiRequest<Crew>(`/crews/${crewId}/players/${playerId}`, { method: 'POST' });
      setCrews(prev => prev.map(c => c._id === crewId ? updated : c));
      setAddingPlayerToCrewId(null);
      const animKey = `${crewId}-${playerId}`;
      setAddedAnimation(prev => ({ ...prev, [animKey]: true }));
      setTimeout(() => setAddedAnimation(prev => { const n = { ...prev }; delete n[animKey]; return n; }), 900);
      setSelectedPlayerId(null);
      flashSaved();
    } catch { showMsg('Failed to add player.', 'danger'); }
  };

  const handleRemovePlayerFromCrew = async (crewId: string, playerId: string) => {
    try {
      const updated = await apiRequest<Crew>(`/crews/${crewId}/players/${playerId}`, { method: 'DELETE' });
      setCrews(prev => prev.map(c => c._id === crewId ? updated : c));
      flashSaved();
    } catch { showMsg('Failed to remove player.', 'danger'); }
  };

  const handleToggleEditor = async (crew: Crew, editorUid: string, enabled: boolean) => {
    const key = `${crew._id}-${editorUid}`;
    setSavingPermission(key);
    try {
      const updated = await apiRequest<Crew>(`/crews/${crew._id}/editors/${editorUid}`, {
        method: enabled ? 'DELETE' : 'POST',
      });
      setCrews(prev => prev.map(c => c._id === crew._id ? updated : c));
      flashSaved();
    } catch {
      showMsg('Failed to update permissions.', 'danger');
    } finally {
      setSavingPermission(null);
    }
  };

  const handleShimmerRename = () => {
    setRenameShimmer(true);
    setTimeout(() => setRenameShimmer(false), 1800);
  };

  const startEmailEdit = (player: Player) => {
    const linkedEmail = player.linkedUserId ? linkedUserMap[player.linkedUserId]?.email : undefined;
    setEditingEmailId(player._id);
    setEditingEmail(player.email ?? linkedEmail ?? '');
  };

  const cancelEmailEdit = () => { setEditingEmailId(null); setEditingEmail(''); };

  const saveEmail = async (id: string) => {
    setSavingEmailId(id);
    try {
      await updatePlayer(id, { email: editingEmail.trim() });
      setEditingEmailId(null);
      showMsg('Email saved.');
      flashSaved();
    } catch { showMsg('Failed to save email.', 'danger'); }
    finally { setSavingEmailId(null); }
  };

  const getPlayerAvatar = (player: Player): string | null => {
    const linkedUser = player.linkedUserId ? linkedUserMap[player.linkedUserId] : undefined;
    return getPlayerCardImage({ ...player, linkedUserPhotoURL: linkedUser?.photoURL }) || null;
  };

  const getEffectiveEmail = (player: Player): string | undefined => {
    if (player.email) return player.email;
    if (player.linkedUserId) return linkedUserMap[player.linkedUserId]?.email;
    return undefined;
  };

  const crewVisiblePlayers = crews.flatMap(crew => crew.players ?? []);
  const visiblePlayerMap = new Map<string, Player>();
  [...players, ...crewVisiblePlayers].forEach(player => {
    if (player?._id) visiblePlayerMap.set(player._id, player);
  });
  const visiblePlayers = [...visiblePlayerMap.values()];

  const playersInCrew = (crew: Crew) =>
    crew.playerIds.map(id => visiblePlayerMap.get(id)).filter(Boolean) as Player[];

  const availableForCrew = (crew: Crew) =>
    players.filter(p => !crew.playerIds.includes(p._id));

  const ownedCrewsForPermissions = crews.filter(crew => crew.ownerUid === currentUser?.uid);

  const renderPlayerRowLeft = (player: Player, crewId: string) => {
    const animKey = `${crewId}-${player._id}`;
    const isNew = !!addedAnimation[animKey];
    return (
      <div key={player._id} className={`crew-member-row${isNew ? ' crew-member-row--added' : ''}`}>
        <div className="crew-member-row__avatar">
          {getPlayerAvatar(player)
            ? <img src={getPlayerAvatar(player)!} alt={player.name} />
            : <span>{player.jerseyNumber}</span>
          }
        </div>
        <div className="crew-member-row__info">
          <span className="crew-member-row__name">{player.name}</span>
          <span className="crew-member-row__pos">{player.preferredPosition}</span>
        </div>
        <button className="crew-member-row__remove" title="Remove from crew"
          onClick={() => handleRemovePlayerFromCrew(crewId, player._id)}>
          <i className="bi bi-x-lg"></i>
        </button>
      </div>
    );
  };

  const renderEmailRow = (player: Player, idx: number) => {
    const isEditing = editingEmailId === player._id;
    const isSaving = savingEmailId === player._id;
    const effectiveEmail = getEffectiveEmail(player);
    const isAutoLinked = !player.email && !!player.linkedUserId && !!effectiveEmail;
    const isSelected = selectedPlayerId === player._id;
    const assignableCrews = crews.filter(crew => crew.ownerUid === currentUser?.uid);

    return (
      <div key={player._id} className="crew-email-section">
        <div
          className={`crew-email-row${!effectiveEmail ? ' crew-email-row--no-email' : ''}${isSelected ? ' crew-email-row--selected' : ''}`}
          style={{ animationDelay: `${idx * 0.04}s` }}
          onClick={() => setSelectedPlayerId(prev => prev === player._id ? null : player._id)}
        >
          <div className="crew-email-row__avatar">
            {getPlayerAvatar(player)
              ? <img src={getPlayerAvatar(player)!} alt={player.name} />
              : <span>{player.jerseyNumber}</span>
            }
          </div>
          <div className="crew-email-row__name">{player.name}</div>

          {isEditing ? (
            <div className="crew-email-row__edit" onClick={e => e.stopPropagation()}>
              <input
                className="crew-email-input" type="email" value={editingEmail}
                onChange={e => setEditingEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveEmail(player._id); if (e.key === 'Escape') cancelEmailEdit(); }}
                autoFocus placeholder="player@example.com"
              />
              <button className="crew-edit-btn crew-edit-btn--save" onClick={() => saveEmail(player._id)} disabled={isSaving}>
                <i className={`bi ${isSaving ? 'bi-hourglass-split' : 'bi-check-lg'}`}></i>
              </button>
              <button className="crew-edit-btn crew-edit-btn--cancel" onClick={cancelEmailEdit}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          ) : (
            <div className="crew-email-row__contact" onClick={e => e.stopPropagation()}>
              {effectiveEmail ? (
                <a href={`mailto:${effectiveEmail}`}
                  className={`crew-email-row__email-pill${isAutoLinked ? ' crew-email-row__email-pill--auto' : ''}`}
                  title={isAutoLinked ? 'Auto-filled from linked account' : effectiveEmail}>
                  <i className="bi bi-envelope-fill"></i>
                  <span>{effectiveEmail}</span>
                  {isAutoLinked && <i className="bi bi-link-45deg" style={{ marginLeft: 4, opacity: 0.6 }}></i>}
                </a>
              ) : (
                <span className="crew-email-row__no-email">
                  <i className="bi bi-envelope-slash"></i> Not registered
                </span>
              )}
              <button className="crew-edit-btn crew-edit-btn--pencil" onClick={() => startEmailEdit(player)} title="Edit email">
                <i className="bi bi-pencil-fill"></i>
              </button>
            </div>
          )}
        </div>

        {isSelected && (
          <div className="crew-picker">
            {assignableCrews.length === 0 && <span className="crew-picker__empty">No crews yet.</span>}
            {assignableCrews.map((crew, ci) => {
              const alreadyIn = crew.playerIds.includes(player._id);
              return (
                <button
                  key={crew._id}
                  className={`crew-picker__item${alreadyIn ? ' crew-picker__item--in' : ''}`}
                  style={{ animationDelay: `${ci * 0.06}s` }}
                  onClick={() => !alreadyIn && handleAddPlayerToCrew(crew._id, player._id)}
                  disabled={alreadyIn}
                >
                  <i className={`bi ${alreadyIn ? 'bi-check-circle-fill' : 'bi-person-plus'}`}></i>
                  <span>{crew.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="page-container">
          <div className="content-card">
            <div className="page-header crew-page__header">
              <div className="back-button-container">
                <BackButton position="static" />
              </div>
              <h2 className="page-title crew-page__title">Crews</h2>
              <div className="crew-left__header-btns">
                {savedFlash && (
                  <span className="crew-saved-badge">
                    <i className="bi bi-check-circle-fill"></i> Kaydedildi
                  </span>
                )}
                <button className="btn-ct crew-left__shimmer-btn" onClick={handleShimmerRename}>
                  <i className="bi bi-pencil-square"></i> Rename Crew
                </button>
                <button className="btn-ct crew-left__add-crew-btn"
                  onClick={() => { setCreatingCrew(true); setTimeout(() => newCrewInputRef.current?.focus(), 50); }}>
                  <i className="bi bi-plus-lg"></i> New Crew
                </button>
              </div>
            </div>

            <div className="crew-tabs">
              <button
                type="button"
                className={`crew-tab ${activeTab === 'crews' ? 'crew-tab--active' : ''}`}
                onClick={() => setActiveTab('crews')}
              >
                <i className="bi bi-people-fill"></i> Crews
              </button>
              <button
                type="button"
                className={`crew-tab ${activeTab === 'permissions' ? 'crew-tab--active' : ''}`}
                onClick={() => setActiveTab('permissions')}
              >
                <i className="bi bi-shield-lock-fill"></i> Permissions
              </button>
            </div>

      {activeTab === 'crews' ? (
      <div className="crew-page">
        <div className="crew-left">
          {creatingCrew && (
            <div className="crew-create-bar">
              <input ref={newCrewInputRef} className="crew-email-input" placeholder="Crew name\u2026"
                value={newCrewName} onChange={e => setNewCrewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreateCrew(); if (e.key === 'Escape') { setCreatingCrew(false); setNewCrewName(''); } }}
              />
              <button className="crew-edit-btn crew-edit-btn--save" onClick={handleCreateCrew}>
                <i className="bi bi-check-lg"></i>
              </button>
              <button className="crew-edit-btn crew-edit-btn--cancel" onClick={() => { setCreatingCrew(false); setNewCrewName(''); }}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          )}

          {(loading || playersLoading) && <p className="crew-empty">Loading...</p>}

          {!loading && !playersLoading && (
            <div className="crew-card-list">
              {(() => {
                const ownedCrews = crews.filter(c => c.ownerUid === currentUser?.uid);
                const memberCrews = crews.filter(c => c.ownerUid !== currentUser?.uid);

                const renderCrewCard = (crew: Crew, readonly: boolean) => {
                  const isOwned = !readonly;
                  return (
                    <div key={crew._id} className="crew-card">
                      <div className="crew-card__header">
                        {isOwned && editingCrewId === crew._id ? (
                          <>
                            <input className="crew-email-input crew-card__rename-input" value={editingCrewName}
                              onChange={e => setEditingCrewName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleRenameCrew(crew._id); if (e.key === 'Escape') setEditingCrewId(null); }}
                              autoFocus
                            />
                            <button className="crew-edit-btn crew-edit-btn--save" onClick={() => handleRenameCrew(crew._id)}>
                              <i className="bi bi-check-lg"></i>
                            </button>
                            <button className="crew-edit-btn crew-edit-btn--cancel" onClick={() => setEditingCrewId(null)}>
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </>
                        ) : (
                          <>
                            <span className={`crew-card__name${renameShimmer && isOwned ? ' crew-card__name--shimmer' : ''}`}>
                              {crew.name}
                            </span>
                            {isOwned && (
                              <div className="crew-card__actions">
                                <button className="crew-edit-btn" title="Rename"
                                  onClick={() => { setEditingCrewId(crew._id); setEditingCrewName(crew.name); }}>
                                  <i className="bi bi-pencil-fill"></i>
                                </button>
                                <button className="crew-edit-btn crew-edit-btn--cancel" title="Delete crew"
                                  onClick={() => handleDeleteCrew(crew._id)}>
                                  <i className="bi bi-trash3-fill"></i>
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="crew-card__members">
                        {playersInCrew(crew).length === 0 && <p className="crew-card__empty">No players yet.</p>}
                        {playersInCrew(crew).map(p => renderPlayerRowLeft(p, crew._id))}
                      </div>

                      {isOwned && (
                        <div className="crew-card__add-player">
                          {addingPlayerToCrewId === crew._id ? (
                            <div className="crew-card__player-select">
                              <select className="crew-email-input" defaultValue=""
                                onChange={e => { if (e.target.value) handleAddPlayerToCrew(crew._id, e.target.value); }}>
                                <option value="" disabled>Select a player…</option>
                                {availableForCrew(crew).map(p => (
                                  <option key={p._id} value={p._id}>{p.name} ({p.preferredPosition})</option>
                                ))}
                              </select>
                              <button className="crew-edit-btn crew-edit-btn--cancel" onClick={() => setAddingPlayerToCrewId(null)}>
                                <i className="bi bi-x-lg"></i>
                              </button>
                            </div>
                          ) : (
                            <button className="crew-card__add-player-btn"
                              onClick={() => setAddingPlayerToCrewId(crew._id)}
                              disabled={availableForCrew(crew).length === 0}>
                              <i className="bi bi-person-plus-fill"></i> Add Player
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                };

                return (
                  <>
                    {ownedCrews.length > 0 && <p className="crew-section-label">MY CREWS</p>}
                    {ownedCrews.map(c => renderCrewCard(c, false))}
                    {memberCrews.length > 0 && <p className="crew-section-label crew-section-label--member">ADDED TO</p>}
                    {memberCrews.map(c => renderCrewCard(c, true))}
                    {crews.length === 0 && players.length > 0 && !creatingCrew && (
                      <p className="crew-empty">Create a crew to start organising your players.</p>
                    )}
                    {visiblePlayers.length === 0 && <p className="crew-empty">No players found.</p>}
                  </>
                );
              })()}
            </div>
          )}
        </div>

        <div className="crew-right">
          <div className="crew-right__header">
            <h2 className="crew-right__title">ALL PLAYERS</h2>
            <p className="crew-right__hint">Click a player to assign to a crew</p>
          </div>
          <div className="crew-email-list">
            {players.map((p, idx) => renderEmailRow(p, idx))}
          </div>
        </div>
      </div>
      ) : (
        <div className="crew-permissions">
          {ownedCrewsForPermissions.length === 0 && (
            <p className="crew-empty">Create a crew before assigning roster permissions.</p>
          )}
          {ownedCrewsForPermissions.map(crew => {
            const memberUids = [...new Set(crew.memberUids ?? [])];
            return (
              <div key={crew._id} className="crew-permission-card">
                <div className="crew-permission-card__header">
                  <span>{crew.name}</span>
                  <small>{memberUids.length} linked member{memberUids.length === 1 ? '' : 's'}</small>
                </div>
                {memberUids.length === 0 ? (
                  <p className="crew-card__empty">No linked members in this crew yet.</p>
                ) : (
                  <div className="crew-permission-list">
                    {memberUids.map(memberUid => {
                      const user = linkedUserMap[memberUid];
                      const isEditor = (crew.editorUids ?? []).includes(memberUid);
                      const key = `${crew._id}-${memberUid}`;
                      return (
                        <div key={memberUid} className="crew-permission-row">
                          <div className="crew-permission-row__avatar">
                            {user?.photoURL ? <img src={user.photoURL} alt={user.displayName} /> : <i className="bi bi-person-fill"></i>}
                          </div>
                          <div className="crew-permission-row__info">
                            <span>{user?.displayName ?? memberUid}</span>
                            <small>{user?.email ?? 'Linked crew member'}</small>
                          </div>
                          <button
                            type="button"
                            className={`crew-permission-toggle ${isEditor ? 'crew-permission-toggle--on' : ''}`}
                            onClick={() => handleToggleEditor(crew, memberUid, isEditor)}
                            disabled={savingPermission === key}
                          >
                            {savingPermission === key
                              ? <span className="spinner-border spinner-border-sm" />
                              : isEditor ? 'Can edit roster' : 'View only'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
          </div>
        </div>
      </div>

      <ToastNotification message={toastMsg} show={showToast} onClose={() => setShowToast(false)} variant={toastVariant} />
    </>
  );
};

export default CrewPage;

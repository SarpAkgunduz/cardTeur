import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';
import ToastNotification from '../components/ToastNotification';
import { useAuth } from '../contexts/AuthContext';
import { usePlayerDisplay } from '../hooks/usePlayerDisplay';
import { apiRequest } from '../services/api/apiClient';
import type { Player } from '../services/api/types';
import './DevelopmentPage.css';

interface Crew {
  _id: string;
  ownerUid: string;
  name: string;
  playerIds: string[];
  editorUids: string[];
  players?: Player[];
}

interface CrewVotingSettings {
  autoTriggerEnabled: boolean;
  windowHours: number;
}

interface VotingSessionSummary {
  _id: string;
  status: 'open' | 'closed';
  closesAt: string;
}

const DevelopmentPage = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { getPlayerCardImage } = usePlayerDisplay();

  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);

  const [votingSettings, setVotingSettings] = useState<Record<string, CrewVotingSettings>>({});
  const [activeVotingSessions, setActiveVotingSessions] = useState<Record<string, VotingSessionSummary | null>>({});
  const [savingCrewId, setSavingCrewId] = useState<string | null>(null);
  const [settingsOpenCrewId, setSettingsOpenCrewId] = useState<string | null>(null);
  const [pickingCrewId, setPickingCrewId] = useState<string | null>(null);
  const [participantIds, setParticipantIds] = useState<string[]>([]);

  const [toastMsg, setToastMsg] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'danger'>('success');
  const [showToast, setShowToast] = useState(false);
  const showMsg = (msg: string, variant: 'success' | 'danger' = 'success') => {
    setToastMsg(msg); setToastVariant(variant); setShowToast(true);
  };

  useEffect(() => {
    apiRequest<Crew[]>('/crews')
      .then(setCrews)
      .catch(() => showMsg(t('match.loadCrewsFailed'), 'danger'))
      .finally(() => setLoading(false));
  }, [t]);

  const leaderCrews = crews.filter(crew =>
    crew.ownerUid === currentUser?.uid || (crew.editorUids ?? []).includes(currentUser?.uid ?? '')
  );

  useEffect(() => {
    leaderCrews.forEach(crew => {
      if (!(crew._id in votingSettings)) {
        apiRequest<CrewVotingSettings>(`/crews/${crew._id}/voting-settings`)
          .then(settings => setVotingSettings(prev => ({ ...prev, [crew._id]: settings })))
          .catch(() => {});
      }
      if (!(crew._id in activeVotingSessions)) {
        apiRequest<VotingSessionSummary | null>(`/crews/${crew._id}/voting-sessions/active`)
          .then(session => setActiveVotingSessions(prev => ({ ...prev, [crew._id]: session })))
          .catch(() => {});
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crews]);

  const toggleSettings = (crewId: string) => {
    setSettingsOpenCrewId(prev => (prev === crewId ? null : crewId));
  };

  const handleToggleAutoTrigger = async (crew: Crew) => {
    const current = votingSettings[crew._id];
    if (!current) return;
    setSavingCrewId(crew._id);
    try {
      const updated = await apiRequest<CrewVotingSettings>(`/crews/${crew._id}/voting-settings`, {
        method: 'PUT',
        body: JSON.stringify({ autoTriggerEnabled: !current.autoTriggerEnabled }),
      });
      setVotingSettings(prev => ({ ...prev, [crew._id]: updated }));
    } catch {
      showMsg(t('crew.votingSettingsSaveFailed'), 'danger');
    } finally {
      setSavingCrewId(null);
    }
  };

  const handleWindowHoursChange = (crewId: string, windowHours: number) => {
    setVotingSettings(prev => ({
      ...prev,
      [crewId]: { ...prev[crewId], windowHours },
    }));
  };

  const saveWindowHours = async (crew: Crew) => {
    const current = votingSettings[crew._id];
    if (!current || current.windowHours <= 0) return;
    setSavingCrewId(crew._id);
    try {
      const updated = await apiRequest<CrewVotingSettings>(`/crews/${crew._id}/voting-settings`, {
        method: 'PUT',
        body: JSON.stringify({ windowHours: current.windowHours }),
      });
      setVotingSettings(prev => ({ ...prev, [crew._id]: updated }));
    } catch {
      showMsg(t('crew.votingSettingsSaveFailed'), 'danger');
    } finally {
      setSavingCrewId(null);
    }
  };

  const openPicker = (crewId: string) => {
    setPickingCrewId(crewId);
    setParticipantIds([]);
  };

  const closePicker = () => {
    setPickingCrewId(null);
    setParticipantIds([]);
  };

  const toggleParticipant = (playerId: string) => {
    setParticipantIds(prev => (
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    ));
  };

  const toggleSelectAll = () => {
    const roster = pickingCrew?.players ?? [];
    setParticipantIds(prev => (
      prev.length === roster.length ? [] : roster.map(player => player._id)
    ));
  };

  const handleStartVoting = async (crew: Crew) => {
    if (participantIds.length === 0) return;
    setSavingCrewId(crew._id);
    try {
      const session = await apiRequest<VotingSessionSummary>(`/crews/${crew._id}/voting-sessions`, {
        method: 'POST',
        body: JSON.stringify({ participantPlayerIds: participantIds }),
      });
      setActiveVotingSessions(prev => ({ ...prev, [crew._id]: session }));
      showMsg(t('crew.votingSessionStarted'));
      closePicker();
    } catch {
      showMsg(t('crew.votingSessionStartFailed'), 'danger');
    } finally {
      setSavingCrewId(null);
    }
  };

  const pickingCrew = leaderCrews.find(crew => crew._id === pickingCrewId) ?? null;

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="content-card development-page">
          <div className="page-header">
            <div className="back-button-container"><BackButton position="static" /></div>
            <h2 className="page-title">{t('development.title')}</h2>
          </div>

          {loading && <p className="crew-empty">{t('common.loading')}</p>}
          {!loading && leaderCrews.length === 0 && (
            <p className="crew-empty">{t('crew.createBeforeAssign')}</p>
          )}

          {!loading && leaderCrews.length > 0 && (
            <>
              <h3 className="development-teams-title">{t('development.teamsTitle')}</h3>
              <div className="development-teams-grid">
                {leaderCrews.map((crew, idx) => {
                  const settings = votingSettings[crew._id];
                  const activeSession = activeVotingSessions[crew._id];
                  const isSaving = savingCrewId === crew._id;
                  const isSettingsOpen = settingsOpenCrewId === crew._id;
                  return (
                    <div
                      key={crew._id}
                      className="team-card"
                      style={{ animationDelay: `${idx * 0.06}s` }}
                    >
                      <div className="team-card__header">
                        <span className="team-card__name">{crew.name}</span>
                        <button
                          type="button"
                          className={`team-card__settings-btn ${isSettingsOpen ? 'team-card__settings-btn--active' : ''}`}
                          onClick={() => toggleSettings(crew._id)}
                          aria-label={t('development.settingsLabel')}
                          title={t('development.settingsLabel')}
                        >
                          <i className="bi bi-gear-fill"></i>
                        </button>
                      </div>

                      <div className={`team-card__settings ${isSettingsOpen ? 'team-card__settings--open' : ''}`}>
                        <div className="team-card__settings-inner">
                        <div className="team-card__settings-content">
                          <div className="team-card__row">
                            <span className="team-card__label">{t('crew.votingAutoTrigger')}</span>
                            <button type="button" className={`crew-permission-toggle ${settings?.autoTriggerEnabled ? 'crew-permission-toggle--on' : ''}`}
                              onClick={() => handleToggleAutoTrigger(crew)} disabled={!settings || isSaving}>
                              {isSaving ? <span className="spinner-border spinner-border-sm" /> : settings?.autoTriggerEnabled ? t('common.on') : t('common.off')}
                            </button>
                          </div>

                          <div className="team-card__row">
                            <span className="team-card__label">{t('crew.votingWindowHours')}</span>
                            <input type="number" min={1} className="crew-email-input team-card__hours-input"
                              value={settings?.windowHours ?? ''}
                              onChange={e => handleWindowHoursChange(crew._id, Number(e.target.value))}
                              onBlur={() => saveWindowHours(crew)}
                              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                              disabled={!settings || isSaving} />
                          </div>
                        </div>
                        </div>
                      </div>

                      <div className="team-card__body">
                        {activeSession && activeSession.status === 'open' ? (
                          <div className="team-card__active">
                            <i className="bi bi-hourglass-split"></i>
                            <span>{t('crew.votingSessionOpenUntil', { date: new Date(activeSession.closesAt).toLocaleString() })}</span>
                            <Link to={`/voting/${activeSession._id}`} className="btn-ct">{t('crew.votingSessionView')}</Link>
                          </div>
                        ) : (
                          <button className="btn-ct team-card__start-btn" onClick={() => openPicker(crew._id)}>
                            <i className="bi bi-hand-thumbs-up"></i> {t('crew.votingSessionStart')}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {pickingCrew && (
        <div className="participant-modal-backdrop" onClick={closePicker}>
          <div className="participant-modal-panel" onClick={e => e.stopPropagation()}>
            <div className="participant-modal-header">
              <i className="bi bi-hand-thumbs-up"></i>
              <h3>{t('development.selectParticipants')}</h3>
              {(pickingCrew.players ?? []).length > 0 && (
                <button type="button" className="participant-modal-selectall" onClick={toggleSelectAll}>
                  {participantIds.length === (pickingCrew.players ?? []).length
                    ? t('development.deselectAll')
                    : t('development.selectAll')}
                </button>
              )}
            </div>
            <p className="participant-modal-subtitle">{t('development.selectParticipantsHint')}</p>

            {(pickingCrew.players ?? []).length === 0 && (
              <p className="crew-empty">{t('crew.noPlayersYet')}</p>
            )}

            <div className="participant-grid">
              {(pickingCrew.players ?? []).map(player => {
                const selected = participantIds.includes(player._id);
                const avatar = getPlayerCardImage(player);
                return (
                  <button
                    type="button"
                    key={player._id}
                    className={`participant-card ${selected ? 'participant-card--selected' : ''}`}
                    onClick={() => toggleParticipant(player._id)}
                  >
                    <div className="participant-card__avatar">
                      {avatar ? <img src={avatar} alt={player.name} /> : <i className="bi bi-person-fill"></i>}
                    </div>
                    <span className="participant-card__name">{player.name}</span>
                    {selected && (
                      <span className="participant-card__badge">
                        <i className="bi bi-check-lg"></i>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="participant-modal-footer">
              <span className="participant-modal-count">
                {t('development.participantsCount', { count: participantIds.length })}
              </span>
              <div className="participant-modal-actions">
                <button type="button" className="crew-edit-btn crew-edit-btn--cancel" onClick={closePicker}>
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  className="btn-ct"
                  onClick={() => handleStartVoting(pickingCrew)}
                  disabled={participantIds.length === 0 || savingCrewId === pickingCrew._id}
                >
                  {savingCrewId === pickingCrew._id
                    ? <span className="spinner-border spinner-border-sm" />
                    : t('crew.votingSessionStart')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastNotification message={toastMsg} show={showToast} onClose={() => setShowToast(false)} variant={toastVariant} />
    </div>
  );
};

export default DevelopmentPage;

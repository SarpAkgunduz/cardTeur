import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BackButton from '../components/BackButton';
import ToastNotification from '../components/ToastNotification';
import { useAuth } from '../contexts/AuthContext';
import { usePlayerDisplay } from '../hooks/usePlayerDisplay';
import { apiRequest } from '../services/api/apiClient';
import './VotingPage.css';

interface SessionParticipant {
  playerId: string;
  linkedUserId?: string;
  name: string;
}

interface VotingSession {
  _id: string;
  status: 'open' | 'closed';
  closesAt: string;
  participants: SessionParticipant[];
}

interface ParticipantPlayer {
  _id: string;
  name: string;
  preferredPosition?: string;
  cardImage?: string;
  linkedUserId?: string;
}

const GK_FIELDS = ['diving', 'handling', 'kicking', 'reflexes', 'gkPositioning', 'gkSpeed'] as const;
const OFFENSIVE_FIELDS = ['dribbling', 'shotAccuracy', 'shotSpeed', 'headers', 'longPass', 'shortPass', 'ballControl', 'positioning', 'vision'] as const;
const DEFENSIVE_FIELDS = ['tackling', 'interceptions', 'marking', 'defensiveIQ'] as const;
const ATHLETICISM_FIELDS = ['speed', 'strength', 'stamina'] as const;

type CategoryKey = 'offensive' | 'defensive' | 'athleticism' | 'gk';

const clampDelta = (value: number) => Math.max(-3, Math.min(3, value));

const VotingPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { getPlayerCardImage } = usePlayerDisplay();

  const [session, setSession] = useState<VotingSession | null>(null);
  const [players, setPlayers] = useState<ParticipantPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [draftDeltas, setDraftDeltas] = useState<Record<string, Record<string, number>>>({});
  const [submittedIds, setSubmittedIds] = useState<Record<string, boolean>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  const [toastMsg, setToastMsg] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'danger'>('success');
  const [showToast, setShowToast] = useState(false);
  const showMsg = (msg: string, variant: 'success' | 'danger' = 'success') => {
    setToastMsg(msg); setToastVariant(variant); setShowToast(true);
  };

  useEffect(() => {
    if (!sessionId) return;
    apiRequest<{ session: VotingSession; players: ParticipantPlayer[] }>(`/voting-sessions/${sessionId}`)
      .then(({ session: loadedSession, players: loadedPlayers }) => {
        setSession(loadedSession);
        setPlayers(loadedPlayers);
      })
      .catch(() => setLoadError(t('voting.loadFailed')))
      .finally(() => setLoading(false));
  }, [sessionId, t]);

  const teammates = players.filter(player => player.linkedUserId !== currentUser?.uid);

  const getDelta = (playerId: string, stat: string) => draftDeltas[playerId]?.[stat] ?? 0;

  const stepStat = (playerId: string, stat: string, direction: 1 | -1) => {
    setDraftDeltas(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], [stat]: clampDelta((prev[playerId]?.[stat] ?? 0) + direction) },
    }));
  };

  const togglePlayerPanel = (playerId: string) => {
    setExpandedPlayerId(prev => (prev === playerId ? null : playerId));
  };

  const submitVote = async (playerId: string) => {
    if (!sessionId) return;
    setSubmittingId(playerId);
    try {
      await apiRequest(`/voting-sessions/${sessionId}/votes`, {
        method: 'POST',
        body: JSON.stringify({ targetPlayerId: playerId, statDeltas: draftDeltas[playerId] ?? {} }),
      });
      setSubmittedIds(prev => ({ ...prev, [playerId]: true }));
      showMsg(t('voting.voteSubmitted'));
    } catch {
      showMsg(t('voting.voteFailed'), 'danger');
    } finally {
      setSubmittingId(null);
    }
  };

  const renderStatGroup = (
    playerId: string,
    category: CategoryKey,
    labelKey: string,
    fields: readonly string[],
    isClosed: boolean,
  ) => (
    <div key={category} className="voting-stat-group">
      <span className="voting-stat-group__label">{t(labelKey)}</span>
      <div className="voting-stat-group__fields">
        {fields.map(stat => {
          const delta = getDelta(playerId, stat);
          return (
            <div key={stat} className="voting-stat">
              <span className="voting-stat__label">{t(`stats.${stat}`)}</span>
              <div className="voting-stepper">
                <button
                  type="button"
                  className="voting-stepper__btn"
                  disabled={isClosed || delta <= -3}
                  onClick={() => stepStat(playerId, stat, -1)}
                  aria-label={`-1 ${stat}`}
                >
                  <i className="bi bi-dash"></i>
                </button>
                <span className={`voting-stepper__val ${delta > 0 ? 'positive' : delta < 0 ? 'negative' : ''}`}>
                  {delta > 0 ? '+' : ''}{delta}
                </span>
                <button
                  type="button"
                  className="voting-stepper__btn"
                  disabled={isClosed || delta >= 3}
                  onClick={() => stepStat(playerId, stat, 1)}
                  aria-label={`+1 ${stat}`}
                >
                  <i className="bi bi-plus"></i>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="content-card voting-page">
          <div className="page-header">
            <div className="back-button-container">
              <BackButton position="static" />
            </div>
            <h2 className="page-title">{t('voting.title')}</h2>
          </div>

          {loading && <p className="voting-empty">{t('common.loading')}</p>}
          {!loading && loadError && <p className="voting-empty">{loadError}</p>}

          {!loading && !loadError && session && (
            <>
              <p className="voting-page__subtitle">
                {session.status === 'open'
                  ? t('voting.openUntil', { date: new Date(session.closesAt).toLocaleString() })
                  : t('voting.closed')}
              </p>

              {teammates.length === 0 && (
                <p className="voting-empty">{t('voting.noTeammates')}</p>
              )}

              <div className="voting-list">
                {teammates.map((player, idx) => {
                  const isGK = player.preferredPosition === 'GK';
                  const isSubmitted = !!submittedIds[player._id];
                  const isSubmitting = submittingId === player._id;
                  const isClosed = session.status !== 'open';
                  const isExpanded = expandedPlayerId === player._id;
                  const avatar = getPlayerCardImage(player);
                  return (
                    <div
                      key={player._id}
                      className={`voting-card ${isExpanded ? 'voting-card--expanded' : ''}`}
                      style={{ animationDelay: `${idx * 0.06}s` }}
                    >
                      <button
                        type="button"
                        className="voting-card__header"
                        onClick={() => togglePlayerPanel(player._id)}
                      >
                        <div className="voting-card__avatar">
                          {avatar ? <img src={avatar} alt={player.name} /> : <i className="bi bi-person-fill"></i>}
                        </div>
                        <span className="voting-card__name">{player.name}</span>
                        {isSubmitted && (
                          <span className="voting-card__badge">
                            <i className="bi bi-check-circle-fill"></i> {t('voting.voted')}
                          </span>
                        )}
                        <i className={`bi bi-chevron-down voting-card__chevron ${isExpanded ? 'voting-card__chevron--open' : ''}`}></i>
                      </button>

                      <div className={`voting-card__panel ${isExpanded ? 'voting-card__panel--open' : ''}`}>
                        <div className="voting-card__panel-inner">
                          <div className="voting-card__panel-content">
                            {isGK
                              ? renderStatGroup(player._id, 'gk', 'playerForm.goalkeeper', GK_FIELDS, isClosed)
                              : (
                                <>
                                  {renderStatGroup(player._id, 'offensive', 'playerForm.offensive', OFFENSIVE_FIELDS, isClosed)}
                                  {renderStatGroup(player._id, 'defensive', 'playerForm.defensive', DEFENSIVE_FIELDS, isClosed)}
                                  {renderStatGroup(player._id, 'athleticism', 'playerForm.athleticism', ATHLETICISM_FIELDS, isClosed)}
                                </>
                              )}

                            <button
                              type="button"
                              className="btn-ct voting-card__submit"
                              disabled={isClosed || isSubmitting}
                              onClick={() => submitVote(player._id)}
                            >
                              {isSubmitting
                                ? <span className="spinner-border spinner-border-sm" />
                                : isSubmitted ? t('voting.updateVote') : t('voting.submitVote')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <ToastNotification message={toastMsg} show={showToast} onClose={() => setShowToast(false)} variant={toastVariant} />
    </div>
  );
};

export default VotingPage;

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FootballPitch, { PitchPlayer } from '../components/FootballPitch';
import MatchDetailsModal from '../components/MatchDetailsModal';
import ToastNotification from '../components/ToastNotification';
import BackButton from '../components/BackButton';
import { apiRequest } from '../services/api/apiClient';
import './SchedulePage.css';

interface SavedPlayer {
  name: string;
  email?: string;
  preferredPosition?: string;
  role?: string;
  x?: number;
  y?: number;
}

interface SavedTeam {
  formation: string;
  ovr: number;
  staminaOvr: number;
  players: SavedPlayer[];
}

interface SavedMatch {
  _id: string;
  teamA: SavedTeam;
  teamB: SavedTeam;
  location?: string;
  date?: string;
  time?: string;
  announced: boolean;
  createdAt: string;
}

const noop = () => {};
const noopRole = (_id: string, _role: string) => {};

function toPitchPlayers(players: SavedPlayer[]): PitchPlayer[] {
  return players.map((p, i) => ({
    id: String(i),
    name: p.name ?? 'Unknown',
    role: p.role ?? p.preferredPosition ?? '?',
    overall: 0,
    cardImage: '',
    x: p.x ?? 50,
    y: p.y ?? 50,
    offOvr: 0,
    defOvr: 0,
    athOvr: 0,
    stamOvr: 0,
  }));
}

const MatchesPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [matches, setMatches] = useState<SavedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [announceTarget, setAnnounceTarget] = useState<SavedMatch | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'danger'>('success');
  const [showToast, setShowToast] = useState(false);

  const showT = (msg: string, variant: 'success' | 'danger' = 'success') => {
    setToastMsg(msg); setToastVariant(variant); setShowToast(true);
  };

  useEffect(() => {
    apiRequest<SavedMatch[]>('/matches')
      .then(data => setMatches(data))
      .catch(() => showT(t('schedule.loadFailed'), 'danger'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await apiRequest(`/matches/${id}`, { method: 'DELETE' });
      setMatches(prev => prev.filter(m => m._id !== id));
      showT(t('schedule.deletedToast'));
    } catch {
      showT(t('schedule.deleteFailed'), 'danger');
    }
  };

  const handleAnnounce = async (details: { location: string; date: string; time: string }) => {
    if (!announceTarget) return;
    try {
      const result = await apiRequest<{ sent: any[] }>(`/matches/${announceTarget._id}/announce`, {
        method: 'POST',
        body: JSON.stringify(details),
      });
      setMatches(prev => prev.map(m => m._id === announceTarget._id ? { ...m, announced: true, ...details } : m));
      showT(t('schedule.announcedToast', { count: result.sent.length }));
    } catch (err: any) {
      showT(t('schedule.announceFailed', { message: err.message }), 'danger');
    }
    setAnnounceTarget(null);
  };

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return iso; }
  };

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="content-card">
      <ToastNotification show={showToast} message={toastMsg} onClose={() => setShowToast(false)} variant={toastVariant} />

      {announceTarget && (
        <MatchDetailsModal
          leftTeam={announceTarget.teamA.players}
          rightTeam={announceTarget.teamB.players}
          onSkip={() => setAnnounceTarget(null)}
          onAnnounce={handleAnnounce}
        />
      )}

      <div className="matches-page">
        <div className="page-header matches-page__header">
          <div className="back-button-container">
            <BackButton position="static" />
          </div>
          <div className="matches-page__title-wrap">
            <h1 className="page-title matches-page__title">{t('schedule.title')}</h1>
          </div>
          <button className="matches-page__new-btn" onClick={() => navigate('/match')}>
            <i className="bi bi-plus-lg me-1" />
            {t('schedule.newMatch')}
          </button>
        </div>

        {loading && (
          <div className="matches-page__loading">
            <div className="matches-spinner" />
            {t('schedule.loading')}
          </div>
        )}

        {!loading && matches.length === 0 && (
          <div className="matches-page__empty" data-tutorial="schedule-list">
            <i className="bi bi-collection" />
            <p>{t('schedule.empty')}</p>
          </div>
        )}

        <div className="matches-list" data-tutorial="schedule-list">
          {matches.map(match => (
            <div key={match._id} className="match-card">
              {/* Match meta */}
              <div className="match-card__meta">
                <div className="match-card__meta-left">
                  <span className="match-card__date">
                    <i className="bi bi-calendar3 me-1" />
                    {match.date ? formatDate(match.date) : formatDate(match.createdAt)}
                  </span>
                  {match.location && (
                    <span className="match-card__location">
                      <i className="bi bi-geo-alt-fill me-1" />
                      {match.location}
                    </span>
                  )}
                  {match.time && (
                    <span className="match-card__time">
                      <i className="bi bi-clock me-1" />
                      {match.time}
                    </span>
                  )}
                </div>
                <div className="match-card__meta-right">
                  {match.announced && (
                    <span className="match-card__badge match-card__badge--announced">
                      <i className="bi bi-send-check-fill me-1" />
                      {t('schedule.announced')}
                    </span>
                  )}
                  <button
                    className="match-card__action match-card__action--announce"
                    onClick={() => setAnnounceTarget(match)}
                  >
                    <i className="bi bi-send-fill me-1" />
                    {t('schedule.announce')}
                  </button>
                  <button
                    className="match-card__action match-card__action--delete"
                    onClick={() => handleDelete(match._id)}
                    title={t('schedule.deleteMatch')}
                  >
                    <i className="bi bi-trash3" />
                  </button>
                </div>
              </div>

              {/* Formation info strip */}
              <div className="match-card__formations">
                <span className="match-card__team-label match-card__team-label--a">
                  {t('schedule.team', { team: 'A' })} — {match.teamA.formation}
                  <span className="match-card__ovr-chip">OVR {match.teamA.ovr}</span>
                </span>
                <span className="match-card__vs">{t('schedule.vs')}</span>
                <span className="match-card__team-label match-card__team-label--b">
                  {match.teamB.formation} — {t('schedule.team', { team: 'B' })}
                  <span className="match-card__ovr-chip">OVR {match.teamB.ovr}</span>
                </span>
              </div>

              {/* Pitch previews */}
              <div className="match-card__pitches">
                <FootballPitch
                  players={toPitchPlayers(match.teamA.players)}
                  teamLabel="A"
                  teamOvr={match.teamA.ovr}
                  teamStaminaOvr={match.teamA.staminaOvr}
                  formationRoles={[]}
                  onMove={noop}
                  onChangeTeam={noop}
                  onChangeRole={noopRole}
                  readOnly
                />
                <FootballPitch
                  players={toPitchPlayers(match.teamB.players)}
                  teamLabel="B"
                  teamOvr={match.teamB.ovr}
                  teamStaminaOvr={match.teamB.staminaOvr}
                  isTeamB
                  formationRoles={[]}
                  onMove={noop}
                  onChangeTeam={noop}
                  onChangeRole={noopRole}
                  readOnly
                />
              </div>

              {/* Player lists */}
              <div className="match-card__rosters">
                <ul className="match-card__roster">
                  {match.teamA.players.map((p, i) => (
                    <li key={i} className="match-card__roster-item">
                      <span className="match-card__roster-role">{p.role ?? p.preferredPosition ?? '?'}</span>
                      {p.name}
                    </li>
                  ))}
                </ul>
                <ul className="match-card__roster">
                  {match.teamB.players.map((p, i) => (
                    <li key={i} className="match-card__roster-item">
                      <span className="match-card__roster-role">{p.role ?? p.preferredPosition ?? '?'}</span>
                      {p.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default MatchesPage;

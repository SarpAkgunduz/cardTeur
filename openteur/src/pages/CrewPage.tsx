import { useEffect, useState } from 'react';
import BackButton from '../components/BackButton';
import type { Player } from '../services/api/types';
import { playerApi } from '../services';
import { apiRequest } from '../services/api/apiClient';
import ToastNotification from '../components/ToastNotification';
import './CrewPage.css';

interface RegisteredUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

const CrewPage = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [registeredMap, setRegisteredMap] = useState<Record<string, RegisteredUser>>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'danger'>('success');
  const [showToast, setShowToast] = useState(false);

  const showMsg = (msg: string, variant: 'success' | 'danger' = 'success') => {
    setToastMsg(msg); setToastVariant(variant); setShowToast(true);
  };

  useEffect(() => {
    playerApi.getAll()
      .then(async (data) => {
        setPlayers(data);
        const emails = data.map(p => p.email).filter(Boolean) as string[];
        if (emails.length > 0) {
          try {
            const users = await apiRequest<RegisteredUser[]>('/users/lookup-by-emails', {
              method: 'POST',
              body: JSON.stringify({ emails }),
            });
            const map: Record<string, RegisteredUser> = {};
            users.forEach(u => { map[u.email] = u; });
            setRegisteredMap(map);
          } catch {
            // silently ignore — crew still works without user profiles
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const refreshRegisteredMap = async (updatedPlayers: Player[]) => {
    const emails = updatedPlayers.map(p => p.email).filter(Boolean) as string[];
    if (emails.length === 0) { setRegisteredMap({}); return; }
    try {
      const users = await apiRequest<RegisteredUser[]>('/users/lookup-by-emails', {
        method: 'POST',
        body: JSON.stringify({ emails }),
      });
      const map: Record<string, RegisteredUser> = {};
      users.forEach(u => { map[u.email] = u; });
      setRegisteredMap(map);
    } catch { /* ignore */ }
  };

  const startEdit = (player: Player) => {
    setEditingId(player._id);
    setEditingEmail(player.email ?? '');
  };

  const cancelEdit = () => { setEditingId(null); setEditingEmail(''); };

  const saveEmail = async (id: string) => {
    setSavingId(id);
    try {
      await playerApi.update(id, { email: editingEmail.trim() } as any);
      const updated = players.map(p =>
        p._id === id ? { ...p, email: editingEmail.trim() || undefined } : p
      );
      setPlayers(updated);
      await refreshRegisteredMap(updated);
      setEditingId(null);
      showMsg('Email saved.');
    } catch {
      showMsg('Failed to save email.', 'danger');
    } finally {
      setSavingId(null);
    }
  };

  const withEmail = players.filter(p => p.email);
  const withoutEmail = players.filter(p => !p.email);

  const renderRow = (player: Player, idx: number, delayBase = 0) => {
    const isEditing = editingId === player._id;
    const isSaving = savingId === player._id;
    const registered = player.email ? registeredMap[player.email] : undefined;

    return (
      <div
        key={player._id}
        className={`crew-row${!player.email ? ' crew-row--no-email' : ''}`}
        style={{ animationDelay: `${(delayBase + idx) * 0.05}s` }}
      >
        <div className="crew-row__avatar">
          {registered?.photoURL
            ? <img src={registered.photoURL} alt={registered.displayName} />
            : player.cardImage
              ? <img src={player.cardImage} alt={player.name} />
              : <span>{player.jerseyNumber}</span>
          }
          {registered && <div className="crew-row__registered-dot" title="Registered user" />}
        </div>
        <div className="crew-row__info">
          <span className="crew-row__name">
            {registered ? registered.displayName : player.name}
          </span>
          <span className="crew-row__position">{player.preferredPosition}</span>
        </div>

        {isEditing ? (
          <div className="crew-row__edit">
            <input
              className="crew-email-input"
              type="email"
              value={editingEmail}
              onChange={e => setEditingEmail(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') saveEmail(player._id);
                if (e.key === 'Escape') cancelEdit();
              }}
              autoFocus
              placeholder="player@example.com"
            />
            <button
              className="crew-edit-btn crew-edit-btn--save"
              onClick={() => saveEmail(player._id)}
              disabled={isSaving}
              title="Save"
            >
              <i className={`bi ${isSaving ? 'bi-hourglass-split' : 'bi-check-lg'}`}></i>
            </button>
            <button
              className="crew-edit-btn crew-edit-btn--cancel"
              onClick={cancelEdit}
              title="Cancel"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        ) : (
          <div className="crew-row__contact">
            {player.email ? (
              <a href={`mailto:${player.email}`} className="crew-row__email" title={player.email}>
                <i className="bi bi-envelope-fill"></i>
                <span>{player.email}</span>
              </a>
            ) : (
              <span className="crew-row__no-email">
                <i className="bi bi-envelope-slash"></i>
                Not registered
              </span>
            )}
            <button
              className="crew-edit-btn crew-edit-btn--pencil"
              onClick={() => startEdit(player)}
              title="Edit email"
            >
              <i className="bi bi-pencil-fill"></i>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="page-container">
          <div className="page-header">
            <div className="back-button-container">
              <BackButton position="static" />
            </div>
            <h2 className="page-title">My Crew</h2>
          </div>

          <div className="content-card">
            {loading && <p className="empty-message">Loading crew...</p>}

            {!loading && players.length === 0 && (
              <p className="empty-message">No players found.</p>
            )}

            {!loading && players.length > 0 && (
              <div className="crew-list">
                {withEmail.map((player, idx) => renderRow(player, idx))}

                {withoutEmail.length > 0 && (
                  <>
                    <div className="crew-divider">
                      <span>No email registered</span>
                    </div>
                    {withoutEmail.map((player, idx) => renderRow(player, idx, withEmail.length))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ToastNotification
        message={toastMsg}
        show={showToast}
        onClose={() => setShowToast(false)}
        variant={toastVariant}
      />
    </>
  );
};

export default CrewPage;

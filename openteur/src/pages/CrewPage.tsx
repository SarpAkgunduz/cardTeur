import { useEffect, useState } from 'react';
import BackButton from '../components/BackButton';
import type { Player } from '../services/api/types';
import { playerApi } from '../services';
import './CrewPage.css';

const CrewPage = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    playerApi.getAll()
      .then(setPlayers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const startEdit = (player: Player) => {
    setEditingId(player._id);
    setEditingEmail(player.email ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingEmail('');
  };

  const saveEmail = async (id: string) => {
    setSavingId(id);
    try {
      await playerApi.update(id, { email: editingEmail.trim() || undefined });
      setPlayers(prev => prev.map(p =>
        p._id === id ? { ...p, email: editingEmail.trim() || undefined } : p
      ));
      setEditingId(null);
    } catch (err) {
      console.error('Failed to save email:', err);
    } finally {
      setSavingId(null);
    }
  };

  const withEmail = players.filter(p => p.email);
  const withoutEmail = players.filter(p => !p.email);

  const renderRow = (player: Player, idx: number, delayBase = 0) => {
    const isEditing = editingId === player._id;
    const isSaving = savingId === player._id;

    return (
      <div
        key={player._id}
        className={`crew-row${!player.email ? ' crew-row--no-email' : ''}`}
        style={{ animationDelay: `${(delayBase + idx) * 0.05}s` }}
      >
        <div className="crew-row__avatar">
          {player.cardImage
            ? <img src={player.cardImage} alt={player.name} />
            : <span>{player.jerseyNumber}</span>
          }
        </div>
        <div className="crew-row__info">
          <span className="crew-row__name">{player.name}</span>
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
  );
};

export default CrewPage;

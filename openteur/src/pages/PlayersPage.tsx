import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Card from '../components/Card';
import ComparePanel from '../components/ComparePanel';
import ConfirmDialog from '../components/ConfirmDialog';
import ToastNotification from '../components/ToastNotification';
import { Player } from '../services';
import { usePlayers } from '../contexts/PlayerContext';
import { usePlayerDisplay } from '../hooks/usePlayerDisplay';
import './PlayersPage.css';

type RandomTier = 'bronze' | 'silver' | 'gold';

const RANDOM_TIERS: Array<{ id: RandomTier; label: string; range: [number, number] }> = [
  { id: 'bronze', label: 'Bronze', range: [41, 59] },
  { id: 'silver', label: 'Silver', range: [60, 84] },
  { id: 'gold', label: 'Gold', range: [85, 89] },
];

const RANDOM_POSITIONS = ['CB', 'RB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST', 'LM', 'RM'];

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomFrom = <T,>(items: T[]) => items[randomInt(0, items.length - 1)];

const getNextRandomPlayerNumber = (players: Player[], label: string) => {
  const pattern = new RegExp(`^${label} Player (\\d+)$`, 'i');
  const highest = players.reduce((max, player) => {
    const match = player.name?.match(pattern);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return highest + 1;
};

const PlayersPage = () => {
  const { players, error: fetchError, deletePlayer, createPlayer } = usePlayers();
  const { getPlayerCardImage, playerPhotoOptions } = usePlayerDisplay();
  const [deleteMode, setDeleteMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [randomPickerOpen, setRandomPickerOpen] = useState(false);
  const [generatingTier, setGeneratingTier] = useState<RandomTier | null>(null);
  const [compareSelection, setCompareSelection] = useState<Player[]>([]);
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'danger'>('success');
  const navigate = useNavigate();

  const handleDelete = (id: string) => setConfirm({
    message: 'Are you sure you want to delete this player?',
    onConfirm: async () => {
      setConfirm(null);
      try {
        await deletePlayer(id);
        setToastMsg('Player deleted successfully.');
        setToastVariant('success');
        setShowToast(true);
      } catch (error) {
        console.error('Delete error:', error);
        setToastMsg('Failed to delete player.');
        setToastVariant('danger');
        setShowToast(true);
      }
    },
  });

  const handleEdit = (id: string) => {
    navigate(`/edit-player/${id}`);
  };

  const handleCompareSelect = (player: Player) => {
    if (!compareSelection.some(p => p._id === player._id)) {
      const updated = [...compareSelection, player];
      setCompareSelection(updated);
    }
  };

  const handleRemoveFromCompare = (id: string) => {
    setCompareSelection(prev => prev.filter(p => p._id !== id));
  };

  const handleCloseCompare = () => {
    setCompareSelection([]);
    setCompareMode(false);
  };

  const buildRandomPlayer = (tier: RandomTier) => {
    const option = RANDOM_TIERS.find(item => item.id === tier) ?? RANDOM_TIERS[0];
    const [min, max] = option.range;
    const target = randomInt(min, max);
    const position = randomFrom(RANDOM_POSITIONS);
    const variance = tier === 'gold' ? 4 : tier === 'silver' ? 7 : 9;
    const stat = () => Math.max(min, Math.min(max, target + randomInt(-variance, variance)));
    const sequence = getNextRandomPlayerNumber(players, option.label);

    return {
      name: `${option.label} Player ${sequence}`,
      email: '',
      cardImage: randomFrom(playerPhotoOptions),
      jerseyNumber: randomInt(1, 99),
      marketValue: target * 100000,
      preferredPosition: position,
      offensiveOverall: stat(),
      defensiveOverall: stat(),
      athleticismOverall: stat(),
      dribbling: stat(),
      shotAccuracy: stat(),
      shotSpeed: stat(),
      headers: stat(),
      longPass: stat(),
      shortPass: stat(),
      ballControl: stat(),
      positioning: stat(),
      vision: stat(),
      tackling: stat(),
      interceptions: stat(),
      marking: stat(),
      defensiveIQ: stat(),
      speed: stat(),
      strength: stat(),
      stamina: stat(),
      gkOverall: 0,
      diving: 0,
      handling: 0,
      kicking: 0,
      reflexes: 0,
      gkPositioning: 0,
      gkSpeed: 0,
    };
  };

  const handleGenerateRandomPlayer = async (tier: RandomTier) => {
    setGeneratingTier(tier);
    try {
      const player = await createPlayer(buildRandomPlayer(tier));
      setToastMsg(`${player.name} generated.`);
      setToastVariant('success');
      setShowToast(true);
      setRandomPickerOpen(false);
    } catch (error) {
      console.error('Generate random player error:', error);
      setToastMsg('Failed to generate player.');
      setToastVariant('danger');
      setShowToast(true);
    } finally {
      setGeneratingTier(null);
    }
  };

  return (
    <div className="page-wrapper" style={{ marginRight: compareSelection.length > 0 ? '500px' : '0px' }}>
      <div className="page-container">
        <div className="content-card">
          {/* Header and Buttons */}
          <div className="page-header players-page__header">
            <div className="back-button-container">
              <BackButton position="static" />
            </div>
            <h2 className="page-title players-page__title">Players</h2>
            <div className="players-page__actions">
              <button
                className={`btn btn-ct ${compareMode ? 'active-mode' : ''}`}
                onClick={() => {
                  const next = !compareMode;
                  setCompareMode(next);
                  setCompareSelection([]);
                  if (next) {
                    setEditMode(false);
                    setDeleteMode(false);
                  }
                }}
              >
                <i className={`bi ${compareMode ? 'bi-x-circle-fill' : 'bi-columns-gap'}`} style={{ marginRight: 8 }}></i>
                {compareMode ? 'Cancel Compare' : 'Compare'}
              </button>
              <button
                className={`btn btn-ct ${editMode ? 'active-mode' : ''}`}
                onClick={() => {
                  const next = !editMode;
                  setEditMode(next);
                  if (next) {
                    setCompareMode(false);
                    setCompareSelection([]);
                    setDeleteMode(false);
                  }
                }}
              >
                <i className={`bi ${editMode ? 'bi-x-circle-fill' : 'bi-pencil-fill'}`} style={{ marginRight: 8 }}></i>
                {editMode ? 'Cancel Edit' : 'Edit Player'}
              </button>
              <button
                className={`btn btn-ct ${deleteMode ? 'active-mode' : ''}`}
                onClick={() => {
                  const next = !deleteMode;
                  setDeleteMode(next);
                  if (next) {
                    setCompareMode(false);
                    setCompareSelection([]);
                    setEditMode(false);
                  }
                }}
              >
                <i className={`bi ${deleteMode ? 'bi-x-circle-fill' : 'bi-trash-fill'}`} style={{ marginRight: 8 }}></i>
                {deleteMode ? 'Cancel' : 'Delete Player'}
              </button>
              <button
                className="btn btn-ct"
                id="createCard"
                onClick={() => navigate('/add')}
              >
                <i className="bi bi-person-plus-fill" style={{ marginRight: 8 }}></i>
                Add Player
              </button>
            </div>
        </div>

        {/* Players Grid */}
        {fetchError ? (
          <p className="empty-message" style={{ color: '#ff6b6b' }}>⚠️ {fetchError}</p>
        ) : (
          <div className="players-grid">
            <div className="players-grid__item">
              <button
                type="button"
                className="random-player-card"
                onClick={() => setRandomPickerOpen(true)}
                aria-label="Generate random player"
              >
                <span className="random-player-card__question">?</span>
                <span className="random-player-card__title">Generate Random Player</span>
                <span className="random-player-card__subtitle">Unlock a new card</span>
              </button>
            </div>
            {players.map((player) => (
            <div key={player._id} className="players-grid__item">
                <Card
                  _id={player._id}
                  name={player.name}
                  cardImage={getPlayerCardImage(player)}
                  preferredPosition={player.preferredPosition}
                  cardTitle={player.cardTitle}
                  offensiveOverall={player.offensiveOverall}
                  defensiveOverall={player.defensiveOverall}
                  athleticismOverall={player.athleticismOverall}
                  gkOverall={player.gkOverall}
                  reflexes={player.reflexes}
                  handling={player.handling}
                  diving={player.diving}
                  deleteMode={deleteMode}
                  onDelete={() => handleDelete(player._id)}
                  editMode={editMode}
                  onEdit={() => handleEdit(player._id)}
                  compareMode={compareMode}
                  onCompareSelect={() => handleCompareSelect(player)}
                  isCompareSelected={compareSelection.some(p => p._id === player._id)}
                />
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      {randomPickerOpen && (
        <div className="random-player-modal" role="dialog" aria-modal="true" aria-label="Generate random player">
          <button
            type="button"
            className="random-player-modal__backdrop"
            aria-label="Close random player generator"
            onClick={() => setRandomPickerOpen(false)}
          />
          <div className="random-player-modal__content">
            <div className="random-player-modal__hero">
              <div className="random-player-card random-player-card--modal">
                <span className="random-player-card__question">?</span>
                <span className="random-player-card__title">Generate Random Player</span>
                <span className="random-player-card__subtitle">Choose a card tier</span>
              </div>
            </div>
            <div className="random-player-modal__choices">
              {RANDOM_TIERS.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  className={`random-tier-card random-tier-card--${tier.id}`}
                  onClick={() => handleGenerateRandomPlayer(tier.id)}
                  disabled={generatingTier !== null}
                >
                  <span className="random-tier-card__overall">?</span>
                  <span className="random-tier-card__mark">?</span>
                  <span className="random-tier-card__name">{tier.label}</span>
                  <span className="random-tier-card__range">{tier.range[0]}-{tier.range[1]} OVR</span>
                  <span className="random-tier-card__action">
                    {generatingTier === tier.id ? 'Generating...' : 'Unlock'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Compare Panel */}
      <ComparePanel
        show={compareSelection.length > 0}
        onClose={handleCloseCompare}
        players={compareSelection}
        onRemovePlayer={handleRemoveFromCompare}
      />

      <ConfirmDialog
        show={confirm !== null}
        message={confirm?.message ?? ''}
        onConfirm={confirm?.onConfirm ?? (() => {})}
        onCancel={() => setConfirm(null)}
      />

      <ToastNotification
        show={showToast}
        message={toastMsg}
        onClose={() => setShowToast(false)}
        variant={toastVariant}
      />
    </div>
  );
};

export default PlayersPage;

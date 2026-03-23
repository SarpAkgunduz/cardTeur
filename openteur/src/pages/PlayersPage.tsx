import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Card from '../components/Card';
import ComparePanel from '../components/ComparePanel';
import ConfirmDialog from '../components/ConfirmDialog';
import ToastNotification from '../components/ToastNotification';
import { playerApi, Player } from '../services';
import './PlayersPage.css';

const PlayersPage = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<Player[]>([]);
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    playerApi.getAll()
      .then((data) => setPlayers(data))
      .catch((error) => console.error('Failed to fetch players:', error));
  }, []);

  const handleDelete = (id: string) => setConfirm({
    message: 'Are you sure you want to delete this player?',
    onConfirm: async () => {
      setConfirm(null);
      try {
        await playerApi.delete(id);
        setPlayers((prev) => prev.filter((p) => p._id !== id));
        setToastMsg('Player deleted successfully.');
        setShowToast(true);
      } catch (error) {
        console.error('Delete error:', error);
        setToastMsg('Failed to delete player.');
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

  return (
    <div className="page-wrapper" style={{ marginRight: compareSelection.length > 0 ? '500px' : '0px' }}>
      <div className="page-container">
        <div className="content-card">
          {/* Header and Buttons */}
                    <div className="page-header" style={{ borderBottom: 'none', width: '100%', justifyContent: 'space-between' }}>
            <div className="back-button-container">
              <BackButton position="static" />
            </div>
            <h2 className="page-title" style={{ flex: 1, textAlign: 'center' }}>Players</h2>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button
                className={`btn btn-ct ${compareMode ? 'active-mode' : ''}`}
                onClick={() => {
                  setCompareMode(!compareMode);
                  setCompareSelection([]);
                }}
              >
                <i className={`bi ${compareMode ? 'bi-x-circle-fill' : 'bi-columns-gap'}`} style={{ marginRight: 8 }}></i>
                {compareMode ? 'Cancel Compare' : 'Compare'}
              </button>
              <button
                className={`btn btn-ct ${editMode ? 'active-mode' : ''}`}
                onClick={() => setEditMode(!editMode)}
              >
                <i className={`bi ${editMode ? 'bi-x-circle-fill' : 'bi-pencil-fill'}`} style={{ marginRight: 8 }}></i>
                {editMode ? 'Cancel Edit' : 'Edit Player'}
              </button>
              <button
                className={`btn btn-ct ${deleteMode ? 'active-mode' : ''}`}
                onClick={() => setDeleteMode(!deleteMode)}
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
        {players.length === 0 ? (
          <p>No players found.</p>
        ) : (
          <div className="row" style={{ width: '100%', margin: 0 }}>
            {players.map((player) => (
              <div key={player._id} className="col-md-4 col-lg-3 mb-4" style={{ display: 'flex', justifyContent: 'center' }}>
                <Card
                  _id={player._id}
                  name={player.name}
                  cardImage={player.cardImage}
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
                />
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Compare Panel */}
      {compareSelection.length > 0 && (
        <ComparePanel
          show={true}
          onClose={handleCloseCompare}
          players={compareSelection}
          onRemovePlayer={handleRemoveFromCompare}
        />
      )}

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
      />
    </div>
  );
};

export default PlayersPage;

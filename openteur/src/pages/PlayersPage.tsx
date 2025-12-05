import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Card from '../components/Card';
import ComparePanel from '../components/ComparePanel';
import { playerApi, Player } from '../services';

const PlayersPage = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<Player[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    playerApi.getAll()
      .then((data) => setPlayers(data))
      .catch((error) => console.error('Failed to fetch players:', error));
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this player?')) return;

    try {
      await playerApi.delete(id);
      setPlayers((prev) => prev.filter((p) => p._id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete player.');
    }
  };

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
                className="gradient-button"
                onClick={() => {
                  setCompareMode(!compareMode);
                  setCompareSelection([]);
                }}
              >
                {compareMode ? 'Cancel Compare' : 'Compare'}
              </button>
              <button
                className="gradient-button"
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? 'Cancel Edit' : 'Edit Player'}
              </button>
              <button
                className="gradient-button"
                onClick={() => setDeleteMode(!deleteMode)}
              >
                {deleteMode ? 'Cancel' : 'Delete Player'}
              </button>
              <button
                className="gradient-button btn-create-card"
                id="createCard" // ✅ Locator for test automation
                onClick={() => navigate('/add')}
              >
              ➕ Add Player
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
    </div>
  );
};

export default PlayersPage;

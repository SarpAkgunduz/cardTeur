import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Card from '../components/Card';
import ComparePanel from '../components/ComparePanel';
import { playerApi, Player } from '../services';

const PlayersPage = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [deleteMode, setDeleteMode] = useState(false);
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
    <div style={{ display: 'flex', transition: 'all 0.3s ease', marginRight: compareSelection.length > 0 ? '500px' : '0px', }}>
      <div
        className="container mt-4"
        style={{
          flex: '1 1 auto',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Back button */}
        <BackButton position="absolute" top="20px" right="20px" />

        {/* Header and Buttons */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Players</h2>
          <div>
            <button
              className="btn btn-warning me-2"
              onClick={() => {
                setCompareMode(!compareMode);
                setCompareSelection([]);
              }}
            >
              {compareMode ? '❌ Cancel Compare' : '📊 Compare'}
            </button>
            <button
              className="btn btn-danger me-2"
              onClick={() => setDeleteMode(!deleteMode)}
            >
              {deleteMode ? '❌ Cancel' : '➖ Delete Player'}
            </button>
            <button
              className="btn btn-success btn-create-card"
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
          <div className="row">
            {players.map((player) => (
              <div key={player._id} className="col-md-4 mb-4">
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
                  compareMode={compareMode}
                  onCompareSelect={() => handleCompareSelect(player)}
                />
              </div>
            ))}
          </div>
        )}
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

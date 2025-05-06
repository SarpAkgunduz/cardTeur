import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Card from '../components/Card'; // ✅ Add this line to import the Card component

interface Player {
  _id: string;
  name: string;
  cardImage: string;
  cardTitle: 'gold' | 'silver' | 'bronze' | 'platinum';
  offensiveOverall: number;
  defensiveOverall: number;
  athleticismOverall: number;
}

const PlayersPage = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/api/players')
      .then((res) => res.json())
      .then((data) => setPlayers(data))
      .catch((err) => console.error('Failed to fetch players:', err));
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this player?')) return;

    const res = await fetch(`http://localhost:5000/api/players/${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setPlayers((prev) => prev.filter((p) => p._id !== id));
    } else {
      alert('Failed to delete player.');
    }
  };

  return (
    <div className="container mt-4">
      {/* Back button */}
      <BackButton position="absolute" top="20px" right="20px" />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Players</h2>
        <div>
          <button className="btn btn-danger me-2" onClick={() => setDeleteMode(!deleteMode)}>
            {deleteMode ? '❌ Cancel' : '➖ Delete Player'}
          </button>
          <button className="btn btn-success" onClick={() => navigate('/add')}>
            ➕ Add Player
          </button>
        </div>
      </div>

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
                cardTitle={player.cardTitle}
                offensiveOverall={player.offensiveOverall}
                defensiveOverall={player.defensiveOverall}
                athleticismOverall={player.athleticismOverall}
                deleteMode={deleteMode}
                onDelete={() => handleDelete(player._id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayersPage;

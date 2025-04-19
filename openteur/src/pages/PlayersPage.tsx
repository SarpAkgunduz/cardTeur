import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/api/players')
      .then((res) => res.json())
      .then((data) => setPlayers(data))
      .catch((err) => console.error('Failed to fetch players:', err));
  }, []);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Players</h2>
        <button className="btn btn-success" onClick={() => navigate('/add')}>
          ➕ Add Player
        </button>
      </div>

      {players.length === 0 ? (
        <p>No players found.</p>
      ) : (
        <div className="row">
          {players.map((player) => (
            <div key={player._id} className="col-md-4 mb-4">
              <div className="card h-100 shadow-sm">
                <img
                  src={player.cardImage}
                  className="card-img-top"
                  alt={player.name}
                  style={{ height: '200px', objectFit: 'cover' }}
                />
                <div className="card-body">
                  <h5 className="card-title">{player.name}</h5>
                  <p className="mb-1"><strong>Title:</strong> {player.cardTitle.toUpperCase()}</p>
                  <p className="mb-1"><strong>Offense:</strong> {player.offensiveOverall}</p>
                  <p className="mb-1"><strong>Defense:</strong> {player.defensiveOverall}</p>
                  <p><strong>Athleticism:</strong> {player.athleticismOverall}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayersPage;

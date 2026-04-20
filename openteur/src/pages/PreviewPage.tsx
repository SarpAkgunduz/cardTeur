import { useEffect, useState } from 'react';
import BackButton from '../components/BackButton';
import Card from '../components/Card';
import type { Player } from '../services/api/types';
import { playerApi } from '../services';
import './PreviewPage.css';

const PreviewPage = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    playerApi.getAll()
      .then(setPlayers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="page-header">
          <div className="back-button-container">
            <BackButton position="static" />
          </div>
          <h2 className="page-title">Player Roster</h2>
        </div>

        <div className="content-card">
          {loading && <p className="empty-message">Loading players...</p>}

          {!loading && players.length === 0 && (
            <p className="empty-message">No players found.</p>
          )}

          {!loading && players.length > 0 && (
            <div className="preview-grid">
              {players.map((player) => (
                <div key={player._id} className="preview-card-wrapper">
                  <Card
                    _id={player._id}
                    name={player.name}
                    preferredPosition={player.preferredPosition}
                    offensiveOverall={player.offensiveOverall}
                    defensiveOverall={player.defensiveOverall}
                    athleticismOverall={player.athleticismOverall}
                    gkOverall={player.gkOverall}
                    cardImage={player.cardImage}
                    cardTitle={player.cardTitle}
                  />
                  {player.email && (
                    <div className="preview-email-chip">
                      <i className="bi bi-envelope-fill"></i>
                      <span>{player.email}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewPage;
  
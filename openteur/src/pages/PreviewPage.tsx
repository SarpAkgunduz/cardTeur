import { useEffect, useState } from 'react';
import BackButton from '../components/BackButton';
import Card from '../components/Card';
import type { Player } from '../services/api/types';
import { playerApi } from '../services';
import './PreviewPage.css';

const POSITION_GROUPS = [
  { key: 'gk',  label: 'Goalkeepers', icon: 'bi-person-fill',     positions: ['GK'] },
  { key: 'def', label: 'Defenders',   icon: 'bi-shield-fill',      positions: ['CB', 'LB', 'RB', 'LWB', 'RWB', 'SW', 'WB'] },
  { key: 'mid', label: 'Midfielders', icon: 'bi-arrow-left-right', positions: ['CM', 'CDM', 'CAM', 'LM', 'RM', 'DM', 'AM'] },
  { key: 'att', label: 'Attackers',   icon: 'bi-lightning-fill',   positions: ['ST', 'CF', 'LW', 'RW', 'SS', 'FW', 'LS', 'RS'] },
];

const PreviewPage = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    playerApi.getAll()
      .then(setPlayers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const sections = POSITION_GROUPS.map(group => ({
    ...group,
    players: players.filter(p =>
      group.positions.includes((p.preferredPosition ?? '').toUpperCase())
    ),
  })).filter(s => s.players.length > 0);

  const ungrouped = players.filter(p => {
    const pos = (p.preferredPosition ?? '').toUpperCase();
    return !POSITION_GROUPS.some(g => g.positions.includes(pos));
  });

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
            <div className="preview-sections">
              {sections.map(section => (
                <div key={section.key} className="preview-section">
                  <div className="preview-section__header">
                    <i className={`bi ${section.icon} preview-section__icon`}></i>
                    <span className="preview-section__label">{section.label}</span>
                    <span className="preview-section__count">{section.players.length}</span>
                  </div>
                  <div className="preview-grid">
                    {section.players.map((player, idx) => (
                      <div
                        key={player._id}
                        className="preview-card-wrapper"
                        style={{ animationDelay: `${idx * 0.06}s` }}
                      >
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
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {ungrouped.length > 0 && (
                <div className="preview-section">
                  <div className="preview-section__header">
                    <i className="bi bi-person-fill preview-section__icon"></i>
                    <span className="preview-section__label">Other</span>
                    <span className="preview-section__count">{ungrouped.length}</span>
                  </div>
                  <div className="preview-grid">
                    {ungrouped.map((player, idx) => (
                      <div
                        key={player._id}
                        className="preview-card-wrapper"
                        style={{ animationDelay: `${idx * 0.06}s` }}
                      >
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
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewPage;
  
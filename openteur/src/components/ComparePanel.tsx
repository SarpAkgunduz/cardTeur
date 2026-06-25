import React, { useState } from 'react';
import { Offcanvas } from 'react-bootstrap';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import './ComparePanel.css';

interface Player {
  _id: string;
  name: string;
  offensiveOverall: number;
  defensiveOverall: number;
  athleticismOverall: number;
}

interface ComparePanelProps {
  show: boolean;
  onClose: () => void;
  players: Player[];
  onRemovePlayer: (id: string) => void;
}

const COLORS = ['#00deec', '#c29b40', '#ff6b6b', '#82ca9d', '#a78bfa'];

const ComparePanel: React.FC<ComparePanelProps> = ({ show, onClose, players, onRemovePlayer }) => {
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const handleRemove = (id: string) => {
    setRemovingIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      onRemovePlayer(id);
      setRemovingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 300);
  };

  const radarData = [
    { stat: 'Offense' },
    { stat: 'Defense' },
    { stat: 'Athleticism' },
  ] as Array<{ stat: string; [key: string]: number | string }>;

  players.forEach(player => {
    radarData[0][player._id] = player.offensiveOverall;
    radarData[1][player._id] = player.defensiveOverall;
    radarData[2][player._id] = player.athleticismOverall;
  });

  const statRows = [
    { label: 'OFF', key: 'offensiveOverall' as const },
    { label: 'DEF', key: 'defensiveOverall' as const },
    { label: 'ATH', key: 'athleticismOverall' as const },
  ];

  return (
    <Offcanvas show={show} onHide={onClose} placement="end" backdrop={false} scroll={true} style={{ width: '460px' }} className="compare-panel">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Compare Players</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        {players.length === 0 ? (
          <div className="cp-empty">
            <i className="bi bi-bar-chart-steps" />
            <p>Select players on the roster to compare</p>
          </div>
        ) : (
          <>
            <div className="cp-chart-wrap">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="stat" tick={{ fill: '#a0b4c8', fontSize: 13, fontWeight: 600 }} />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  {players.map((player, idx) => (
                    <Radar
                      key={player._id}
                      name={player.name}
                      dataKey={player._id}
                      stroke={COLORS[idx % COLORS.length]}
                      fill={COLORS[idx % COLORS.length]}
                      fillOpacity={Math.max(0.08, 0.3 - players.length * 0.04)}
                      strokeWidth={2}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="cp-stats-table">
              <div className="cp-stats-header">
                <span className="cp-stats-header__name">Player</span>
                {statRows.map(s => (
                  <span key={s.label} className="cp-stats-header__val">{s.label}</span>
                ))}
              </div>
              {players.map((player, idx) => (
                <div key={player._id} className={`cp-stats-row ${removingIds.has(player._id) ? 'cp-stats-row--removing' : ''}`}>
                  <span className="cp-stats-name">
                    <span className="cp-color-dot" style={{ background: COLORS[idx % COLORS.length] }} />
                    <span className="cp-stats-name__text">{player.name}</span>
                  </span>
                  {statRows.map(s => {
                    const val = Math.round(player[s.key]);
                    return (
                      <span key={s.label} className="cp-stats-val">
                        <span className="cp-stats-val__bar" style={{ width: `${val}%`, background: COLORS[idx % COLORS.length] }} />
                        <span className="cp-stats-val__num">{val}</span>
                      </span>
                    );
                  })}
                  <button className="cp-stats-remove" onClick={() => handleRemove(player._id)} aria-label={`Remove ${player.name}`}>
                    <i className="bi bi-x" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default ComparePanel;

import React from 'react';
import { Offcanvas } from 'react-bootstrap';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';
import './ComparePanel.css'; // Assuming you have some styles for the panel
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

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff6b6b', '#00bcd4'];

const ComparePanel: React.FC<ComparePanelProps> = ({ show, onClose, players, onRemovePlayer }) => {
  const radarData: Array<{ stat: string;[key: string]: number | string }> = [
    { stat: 'Offense' },
    { stat: 'Defense' },
    { stat: 'Athleticism' },
  ];

  players.forEach((player) => {
    radarData[0][player.name] = player.offensiveOverall;
    radarData[1][player.name] = player.defensiveOverall;
    radarData[2][player.name] = player.athleticismOverall;
  });

  return (
    <Offcanvas show={show} onHide={onClose} placement="end" backdrop={false} scroll={true} style={{ width: '500px' }}>
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Compare Players</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        {players.length === 0 ? (
          <p>No players selected.</p>
        ) : (
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <RadarChart
              outerRadius="70%"
              width={Math.min(400, window.innerWidth - 100)} // safer dynamic width
              height={400}
              data={radarData}
            >
              <PolarGrid />
              <PolarAngleAxis dataKey="stat" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              {players.map((player, idx) => (
                <Radar
                  key={player._id}
                  name={player.name}
                  dataKey={player.name}
                  stroke={COLORS[idx % COLORS.length]}
                  fill={COLORS[idx % COLORS.length]}
                  fillOpacity={0.9}
                />
              ))}
              <Legend />
            </RadarChart>
          </div>
        )}
        <div className="d-flex flex-wrap mb-3">
          {players.map((player) => (
            <span key={player._id} className="player-badge">
            {player.name}
            <button
              className="remove-btn"
              onClick={() => onRemovePlayer(player._id)}
            >
              ❌
            </button>
          </span>
          ))}
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default ComparePanel;

import React from 'react';
import './Card.css';

export interface CardProps {
  _id: string;
  name: string;
  preferredPosition: string;
  offensiveOverall: number;
  defensiveOverall: number;
  athleticismOverall: number;
  gkOverall?: number;
  reflexes?: number;
  handling?: number;
  diving?: number;
  cardImage: string;
  cardTitle?: 'bronze' | 'silver' | 'gold' | 'platinum' | string; // optional

  /*deleteMode is a boolean that will be used to toggle the delete button*/
  deleteMode?: boolean;
  onDelete?: () => void; // or (id: string) => void if you want to pass an id

  /*editMode is a boolean that will be used to toggle the edit button*/
  editMode?: boolean;
  onEdit?: () => void;

  compareMode?: boolean;
  onCompareSelect?: () => void;
  isCompareSelected?: boolean;
}

const Card: React.FC<CardProps> = ({
  name,
  preferredPosition,
  offensiveOverall,
  defensiveOverall,
  athleticismOverall,
  gkOverall,
  reflexes,
  handling,
  diving,
  cardImage,
  cardTitle,
  /*deleteMode is a boolean that will be used to toggle the delete button*/
  deleteMode = false,
  onDelete,
  /*editMode is a boolean that will be used to toggle the edit button*/
  editMode = false,
  onEdit,
  compareMode = false,
  onCompareSelect,
  isCompareSelected = false,
}) => {
  const isGK = preferredPosition?.toUpperCase() === 'GK';

  const overallRating = isGK
    ? (gkOverall || Math.round((defensiveOverall + athleticismOverall) / 2))
    : Math.round((offensiveOverall + defensiveOverall + athleticismOverall) / 3);

  const displayStats = isGK
    ? [
        { val: reflexes  ?? 0, lbl: 'REF' },
        { val: handling  ?? 0, lbl: 'HAN' },
        { val: diving    ?? 0, lbl: 'DIV' },
      ]
    : [
        { val: offensiveOverall,   lbl: 'OFF' },
        { val: athleticismOverall, lbl: 'ATH' },
        { val: defensiveOverall,   lbl: 'DEF' },
      ];

  const cardType = cardTitle || 'bronze';

  return (
    <div
      className={`ct-player-card ct-player-card--${cardType} ${editMode ? 'editable' : ''} ${compareMode ? 'comparable' : ''} ${isCompareSelected ? 'compare-selected' : ''}`}
      onClick={editMode ? onEdit : compareMode ? onCompareSelect : undefined}
    >
      {/* Minus button in delete mode */}
      {deleteMode && (
        <button
          onClick={() => onDelete && onDelete()}
          className="btn btn-danger btn-sm position-absolute top-0 start-0 ms-2 mt-2"
          style={{ zIndex: 10 }}
        >
          ➖
        </button>
      )}

      {/* Selected indicator in compare mode */}
      {isCompareSelected && (
        <div className="compare-selected-badge">
          <i className="bi bi-check-lg"></i>
        </div>
      )}

      {/* Top: Overall rating + Position */}
      <div className="ct-player-card__top">
        <div className="ct-player-card__meta">
          <span className="ct-player-card__overall">{overallRating}</span>
          <span className="ct-player-card__pos">{preferredPosition}</span>
        </div>
      </div>

      {/* Player image */}
      <div className="ct-player-card__image-area">
        <img src={cardImage} alt={name} />
      </div>

      {/* Bottom: Name + Divider + Stats */}
      <div className="ct-player-card__bottom">
        <div className="ct-player-card__name">{name}</div>
        <div className="ct-player-card__sep" />
        <div className="ct-player-card__stats">
          {displayStats.map(({ val, lbl }) => (
            <div className="ct-player-card__stat-item" key={lbl}>
              <span className="ct-player-card__stat-val">{val}</span>
              <span className="ct-player-card__stat-lbl">{lbl}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Card;

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

  /*onCompareSelect is a function that will be called when the compare button is clicked*/
  compareMode?: boolean;
  onCompareSelect?: () => void;
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
  /*onCompareSelect is a function that will be called when the compare button is clicked*/
  compareMode = false,
  onCompareSelect,
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
      className={`fifa-card fifa-card--${cardType} ${editMode ? 'editable' : ''}`}
      onClick={editMode ? onEdit : undefined}
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

      {/* Plus button in compare mode */}
      {/* This button will be used to select the player for comparison */}
      {/* It will be shown only if compareMode is true */}
      {/* The button will call the onCompareSelect function when clicked */}
      {compareMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onCompareSelect && onCompareSelect(); }}
          className="btn btn-primary btn-sm position-absolute top-0 end-0 m-2"
          style={{ zIndex: 10 }}
        >
          ➕
        </button>
      )}

      {/* Top: Overall rating + Position */}
      <div className="fifa-card__top">
        <div className="fifa-card__meta">
          <span className="fifa-card__overall">{overallRating}</span>
          <span className="fifa-card__pos">{preferredPosition}</span>
        </div>
      </div>

      {/* Player image */}
      <div className="fifa-card__image-area">
        <img src={cardImage} alt={name} />
      </div>

      {/* Bottom: Name + Divider + Stats */}
      <div className="fifa-card__bottom">
        <div className="fifa-card__name">{name}</div>
        <div className="fifa-card__sep" />
        <div className="fifa-card__stats">
          {displayStats.map(({ val, lbl }) => (
            <div className="fifa-card__stat-item" key={lbl}>
              <span className="fifa-card__stat-val">{val}</span>
              <span className="fifa-card__stat-lbl">{lbl}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Card;

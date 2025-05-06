import React from 'react';
import './Card.css';

export interface CardProps {
  _id: string;
  // _id is used for delete operation, so it's required
  // but not used in the component itself
  name: string;
  offensiveOverall: number;
  defensiveOverall: number;
  athleticismOverall: number;
  cardImage: string;
  cardTitle: "gold" | "silver" | "bronze" | "platinum";
  deleteMode?: boolean;
  onDelete?: () => void; // or (id: string) => void if you want to pass an id
}

const Card: React.FC<CardProps> = ({
  name,
  offensiveOverall,
  defensiveOverall,
  athleticismOverall,
  cardImage,
  /*Card title is not used in the component, but it's part of the props in future it can be added as a feature.*/
  cardTitle,
  deleteMode = false,
  onDelete,
}) => {
  return (
    <div className="card position-relative">
      {/* Minus button in delete mode */}
      {deleteMode && (
        <button
          onClick={onDelete}
          className="btn btn-danger btn-sm position-absolute top-0 start-0 ms-2 mt-2"
          style={{ zIndex: 10 }}
        >
          ➖
        </button>
      )}

      {/* Card content */}
      <h3>{name}</h3>
      <img src={cardImage} alt={name} />
      <div className="stat-bar">
        <span>OFF: {offensiveOverall}</span>
        <span>ATH: {athleticismOverall}</span>
        <span>DEF: {defensiveOverall}</span>
      </div>
    </div>
  );
};

export default Card;

import React from 'react';
import './Card.css';

export interface CardProps {
  name: string;
  offensiveOverall: string;
  defensiveOverall: string;
  athleticismOverall: string;
  cardImage: string;
  cardTitle: "gold" | "silver" | "bronze" | "platinum";
}

const Card: React.FC<CardProps> = ({
  name,
  offensiveOverall,
  defensiveOverall,
  athleticismOverall,
  cardImage,
  cardTitle,
}) => {
  return (
    <div className="card">
      <h3>{name}</h3>
      <img src={cardImage} alt={name} />
      <p style={{ fontWeight: "bold" }}></p>
      
      <div className="stat-bar">
        <span>OFF: {offensiveOverall}</span>
        <span>ATH: {athleticismOverall}</span>
        <span>DEF: {defensiveOverall}</span>
      </div>
    </div>

  );
};

export default Card;

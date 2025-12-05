import React from 'react';
import './Card.css';

export interface CardProps {
  _id: string;
  // _id is used for delete operation, so it's required
  // but not used in the component itself
  name: string;
  preferredPosition: string;
  offensiveOverall: number;
  defensiveOverall: number;
  athleticismOverall: number;
  cardImage: string;
  cardTitle: "gold" | "silver" | "bronze" | "platinum";
  deleteMode?: boolean;
  onDelete?: () => void; // or (id: string) => void if you want to pass an id
  editMode?: boolean;
  onEdit?: () => void;
  compareMode?: boolean;
  onCompareSelect?: () => void;
}

const Card: React.FC<CardProps> = ({
  name,
  preferredPosition,
  offensiveOverall,
  defensiveOverall,
  athleticismOverall,
  cardImage,
  /*Card title is not used in the component, but it's part of the props in future it can be added as a feature.*/
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
  const handleCardClick = () => {
    if (editMode && onEdit) {
      onEdit();
    }
  };

  return (
    <div 
      className={`card position-relative card-container ${editMode ? 'editable' : ''}`}
      onClick={handleCardClick}
    >
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
      {/* Edit button in edit mode - removed, now card itself is clickable */}
      {editMode && false && (
        <button
          onClick={onEdit}
          className="btn btn-warning btn-sm position-absolute top-0 start-0 ms-2 mt-2"
          style={{ zIndex: 10 }}
        >
          ✏️
        </button>
      )}
      {/* Plus button in compare mode */}
      {/* This button will be used to select the player for comparison */}
      {/* It will be shown only if compareMode is true */}
      {/* The button will call the onCompareSelect function when clicked */}
      {compareMode && (
        <button
          onClick={onCompareSelect}
          className="btn btn-primary btn-sm position-absolute top-0 end-0 m-2"
          style={{ zIndex: 10 }}
        >
          ➕
        </button>
      )}
      {/* Card content */}
      <h3>{name}</h3>
      <img src={cardImage} alt={name} />
      <div className="position-badge">
        {preferredPosition}
      </div>
      <div className="stat-bar">
        <span>OFF: {offensiveOverall}</span>
        <span>ATH: {athleticismOverall}</span>
        <span>DEF: {defensiveOverall}</span>
      </div>
    </div>
  );
};

export default Card;

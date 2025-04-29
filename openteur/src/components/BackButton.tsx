import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackButton = ({
  position = 'static', // or 'absolute'
  top = '20px',
  right = '20px',
  className = ''
}: {
  position?: 'static' | 'absolute';
  top?: string;
  right?: string;
  className?: string;
}) => {
  const navigate = useNavigate();

  return (
    <div
      style={
        position === 'absolute'
          ? { position: 'absolute', top, right }
          : {}
      }
    >
      <button
        className={`btn btn-secondary ${className}`}
        onClick={() => navigate(-1)}
      >
        ⬅️ Back
      </button>
    </div>
  );
};

export default BackButton;

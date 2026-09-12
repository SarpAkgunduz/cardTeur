import React from 'react';

export interface StatField {
  id: string;
  label: string;
  value: number;
  setter: (v: number) => void;
}

interface StatGridProps {
  fields: StatField[];
  style?: React.CSSProperties;
}

const StatGrid = ({ fields, style }: StatGridProps) => (
  <div className="stat-grid" style={style}>
    {fields.map(({ id, label, value, setter }) => (
      <div className="stat-field" key={id}>
        <label htmlFor={id}>
          <span>{label}</span>
          <span className="stat-field__val">{value}</span>
        </label>
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          className="stat-slider"
          value={value}
          onChange={(e) => setter(Math.min(100, Math.max(0, +e.target.value)))}
        />
      </div>
    ))}
  </div>
);

export default StatGrid;

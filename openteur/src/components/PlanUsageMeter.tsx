import React from 'react';
import './PlanUsageMeter.css';

interface PlanUsageMeterProps {
  label: string;
  used: number;
  limit: number;
}

const PlanUsageMeter: React.FC<PlanUsageMeterProps> = ({ label, used, limit }) => {
  const unlimited = limit === Infinity;
  const ratio = unlimited ? 0 : Math.min(1, used / limit);
  const nearLimit = !unlimited && ratio >= 0.8;
  const atLimit = !unlimited && used >= limit;

  return (
    <div className={`plan-usage-meter ${atLimit ? 'plan-usage-meter--full' : nearLimit ? 'plan-usage-meter--warn' : ''}`}>
      <span className="plan-usage-meter__label">{label}</span>
      <span className="plan-usage-meter__count">
        {used} {unlimited ? '' : `/ ${limit}`}
      </span>
      {!unlimited && (
        <span className="plan-usage-meter__bar">
          <span className="plan-usage-meter__fill" style={{ width: `${ratio * 100}%` }} />
        </span>
      )}
    </div>
  );
};

export default PlanUsageMeter;

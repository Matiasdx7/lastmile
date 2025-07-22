import React from 'react';
import { LucideIcon } from 'lucide-react';
import './StatsCard.css';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color
}) => {
  return (
    <div className="stats-card">
      <div className="stats-card-content">
        <div className="stats-info">
          <h3 className="stats-title">{title}</h3>
          <p className="stats-value">{value}</p>
          <div className={`stats-change ${changeType}`}>
            <span>{change}</span>
          </div>
        </div>
        <div className="stats-icon" style={{ backgroundColor: color }}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
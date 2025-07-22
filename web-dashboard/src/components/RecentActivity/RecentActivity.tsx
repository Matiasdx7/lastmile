import React from 'react';
import { Package, Truck, CheckCircle, Navigation, AlertTriangle, Info } from 'lucide-react';
import './RecentActivity.css';

interface Activity {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'info' | 'error';
}

interface RecentActivityProps {
  activities: Activity[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order_created':
        return Package;
      case 'vehicle_dispatched':
        return Truck;
      case 'delivery_completed':
        return CheckCircle;
      case 'route_optimized':
        return Navigation;
      case 'delivery_failed':
        return AlertTriangle;
      default:
        return Info;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Hace un momento';
    if (minutes < 60) return `Hace ${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `Hace ${days}d`;
  };

  return (
    <div className="recent-activity">
      {activities.length === 0 ? (
        <div className="no-activities">
          <Info size={24} />
          <p>No hay actividad reciente</p>
        </div>
      ) : (
        <div className="activity-list">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <div key={activity.id} className="activity-item">
                <div className={`activity-icon ${activity.status}`}>
                  <Icon size={16} />
                </div>
                <div className="activity-content">
                  <p className="activity-message">{activity.message}</p>
                  <span className="activity-time">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
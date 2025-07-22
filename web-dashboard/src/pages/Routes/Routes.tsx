import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RoutePlanner from '../../components/RoutePlanner';
import './Routes.css';

interface RouteListItem {
  id: string;
  loadId: string;
  vehicleId: string;
  status: string;
  totalDistance: number;
  estimatedDuration: number;
  createdAt: string;
}

const Routes: React.FC = () => {
  const { routeId } = useParams<{ routeId?: string }>();
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<RouteListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        
        // In a real app, we would fetch from the API
        // For now, use mock data
        setTimeout(() => {
          setRoutes([
            {
              id: 'route-123',
              loadId: 'load-456',
              vehicleId: 'vehicle-789',
              status: 'PLANNED',
              totalDistance: 15000,
              estimatedDuration: 3600,
              createdAt: new Date().toISOString()
            },
            {
              id: 'route-456',
              loadId: 'load-789',
              vehicleId: 'vehicle-123',
              status: 'DISPATCHED',
              totalDistance: 25000,
              estimatedDuration: 5400,
              createdAt: new Date().toISOString()
            },
            {
              id: 'route-789',
              loadId: 'load-123',
              vehicleId: 'vehicle-456',
              status: 'COMPLETED',
              totalDistance: 10000,
              estimatedDuration: 2700,
              createdAt: new Date().toISOString()
            }
          ]);
          setLoading(false);
        }, 500);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  const handleRouteSelect = (id: string) => {
    navigate(`/routes/${id}`);
  };

  // Format distance for display
  const formatDistance = (meters: number) => {
    const kilometers = meters / 1000;
    return `${kilometers.toFixed(1)} km`;
  };

  // Format duration for display
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading && !routeId) {
    return <div className="routes-loading">Loading routes...</div>;
  }

  if (error && !routeId) {
    return <div className="routes-error">Error: {error}</div>;
  }

  return (
    <div className="routes-container">
      {routeId ? (
        <RoutePlanner routeId={routeId} />
      ) : (
        <>
          <h2>Routes</h2>
          <div className="routes-list">
            <table className="routes-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Load</th>
                  <th>Vehicle</th>
                  <th>Status</th>
                  <th>Distance</th>
                  <th>Duration</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route) => (
                  <tr key={route.id}>
                    <td>{route.id.substring(0, 8)}...</td>
                    <td>{route.loadId.substring(0, 8)}...</td>
                    <td>{route.vehicleId.substring(0, 8)}...</td>
                    <td>
                      <span className={`status-badge status-${route.status.toLowerCase()}`}>
                        {route.status}
                      </span>
                    </td>
                    <td>{formatDistance(route.totalDistance)}</td>
                    <td>{formatDuration(route.estimatedDuration)}</td>
                    <td>{new Date(route.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="btn-plan-route"
                        onClick={() => handleRouteSelect(route.id)}
                      >
                        Plan Route
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Routes;
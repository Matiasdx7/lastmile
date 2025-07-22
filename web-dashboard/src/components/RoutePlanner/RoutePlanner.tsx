import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import './RoutePlanner.css';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { mockRoute, mockMapData, mockTimeWindowConflicts, reorderStops } from './mockData';

// Fix for Leaflet marker icons in React
// This is needed because Leaflet's default icon path is broken in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RouteStop {
  orderId: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  sequence: number;
  estimatedArrival: string;
}

interface RouteMapData {
  polyline: string;
  waypoints: {
    location: {
      latitude: number;
      longitude: number;
    };
    orderId: string;
    sequence: number;
    estimatedArrival: string;
  }[];
}

interface RoutePlannerProps {
  routeId: string;
}

const RoutePlanner: React.FC<RoutePlannerProps> = ({ routeId }) => {
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [mapData, setMapData] = useState<RouteMapData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeWindowConflicts, setTimeWindowConflicts] = useState<string[]>([]);

  // Use mock data for development

  // Fetch route data
  useEffect(() => {
    const fetchRouteData = async () => {
      try {
        setLoading(true);
        
        // In a real app, we would fetch data from the API
        // For now, use mock data
        setStops(mockRoute.stops);
        setMapData(mockMapData);
        
        // Simulate API delay
        setTimeout(() => {
          setLoading(false);
          
          // Check for time window conflicts after loading
          checkTimeWindowConflicts();
        }, 500);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setLoading(false);
      }
    };
    
    fetchRouteData();
  }, [routeId]);

  // Handle drag end event
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(stops);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update local state immediately for responsive UI
    setStops(items);
    
    try {
      // Get the order of orderIds after reordering
      const stopOrder = items.map(stop => stop.orderId);
      
      // In a real app, we would send the new order to the server
      // For now, use mock data
      
      // Use the reorderStops function from mockData to simulate server response
      const reorderedStops = reorderStops(stops, stopOrder);
      
      // Simulate API delay
      setTimeout(() => {
        // Update stops with the reordered stops
        setStops(reorderedStops);
        
        // Show some mock time window conflicts
        setTimeWindowConflicts(mockTimeWindowConflicts);
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  // Check for time window conflicts
  const checkTimeWindowConflicts = async () => {
    try {
      // In a real app, we would send a request to the server
      // For now, use mock data
      
      // Simulate API delay
      setTimeout(() => {
        setTimeWindowConflicts(mockTimeWindowConflicts);
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Decode polyline
  const decodePolyline = (encoded: string): [number, number][] => {
    if (!encoded) return [];
    
    try {
      // Using a simple polyline decoder implementation
      const points: [number, number][] = [];
      let index = 0;
      const len = encoded.length;
      let lat = 0;
      let lng = 0;
      
      while (index < len) {
        let b;
        let shift = 0;
        let result = 0;
        
        do {
          b = encoded.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);
        
        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;
        
        shift = 0;
        result = 0;
        
        do {
          b = encoded.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);
        
        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;
        
        points.push([lat * 1e-5, lng * 1e-5]);
      }
      
      return points;
    } catch (error) {
      console.error('Error decoding polyline:', error);
      return [];
    }
  };

  if (loading) {
    return <div className="route-planner-loading">Loading route data...</div>;
  }

  if (error) {
    return <div className="route-planner-error">Error: {error}</div>;
  }

  return (
    <div className="route-planner-container">
      <h2>Route Planner</h2>
      
      {timeWindowConflicts.length > 0 && (
        <div className="time-window-conflicts">
          <h3>Time Window Conflicts</h3>
          <ul>
            {timeWindowConflicts.map((conflict, index) => (
              <li key={index} className="conflict-item">{conflict}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="route-planner-layout">
        <div className="stops-container">
          <h3>Drag and Drop Stops to Reorder</h3>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="stops">
              {(provided: any) => (
                <ul className="stops-list" {...provided.droppableProps} ref={provided.innerRef}>
                  {stops.map((stop, index) => (
                    <Draggable key={stop.orderId} draggableId={stop.orderId} index={index}>
                      {(provided: any) => (
                        <li
                          className="stop-item"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <div className="stop-sequence">{index + 1}</div>
                          <div className="stop-details">
                            <div className="stop-address">
                              {stop.address.street}, {stop.address.city}
                            </div>
                            <div className="stop-time">
                              ETA: {formatTime(stop.estimatedArrival)}
                            </div>
                          </div>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        </div>
        
        <div className="map-container">
          <div className="map-placeholder">
            <h3>Map View</h3>
            <p>Map would display here with the following waypoints:</p>
            <ul>
              {mapData && mapData.waypoints.map((waypoint, index) => (
                <li key={waypoint.orderId}>
                  <strong>Stop {index + 1}:</strong> {waypoint.location.latitude.toFixed(4)}, {waypoint.location.longitude.toFixed(4)} - ETA: {formatTime(waypoint.estimatedArrival)}
                </li>
              ))}
            </ul>
            <p><em>Note: In a production environment, this would be an interactive map with markers and route lines.</em></p>
          </div>
        </div>
      </div>
      
      <div className="route-summary">
        <h3>Route Summary</h3>
        <p>Total Stops: {stops.length}</p>
        {/* Add more summary information here */}
      </div>
    </div>
  );
};

export default RoutePlanner;
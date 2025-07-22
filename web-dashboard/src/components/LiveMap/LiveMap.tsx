import React from 'react';
import { MapPin, Truck, Navigation } from 'lucide-react';
import './LiveMap.css';

const LiveMap: React.FC = () => {
    // Mock vehicle data - in real app this would come from WebSocket
    const vehicles = [
        {
            id: 'VH-001',
            driver: 'Juan Pérez',
            status: 'en_ruta',
            currentStop: 'Av. Principal 123',
            nextStop: 'Calle Secundaria 456',
            progress: 65,
            eta: '15 min'
        },
        {
            id: 'VH-002',
            driver: 'María García',
            status: 'entregando',
            currentStop: 'Plaza Central 789',
            nextStop: 'Barrio Norte 321',
            progress: 40,
            eta: '25 min'
        },
        {
            id: 'VH-003',
            driver: 'Carlos López',
            status: 'disponible',
            currentStop: 'Base Central',
            nextStop: '-',
            progress: 0,
            eta: '-'
        }
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'en_ruta':
                return '#3b82f6';
            case 'entregando':
                return '#10b981';
            case 'disponible':
                return '#6b7280';
            default:
                return '#6b7280';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'en_ruta':
                return 'En Ruta';
            case 'entregando':
                return 'Entregando';
            case 'disponible':
                return 'Disponible';
            default:
                return 'Desconocido';
        }
    };

    return (
        <div className="live-map">
            {/* Map placeholder - in real app this would be Google Maps or similar */}
            <div className="map-container">
                <div className="map-placeholder">
                    <div className="map-grid">
                        {/* Simulated map grid */}
                        {Array.from({ length: 100 }).map((_, i) => (
                            <div key={i} className="grid-cell" />
                        ))}
                    </div>

                    {/* Vehicle markers */}
                    <div className="vehicle-marker" style={{ top: '30%', left: '25%' }}>
                        <Truck size={16} color="#3b82f6" />
                    </div>
                    <div className="vehicle-marker" style={{ top: '60%', left: '70%' }}>
                        <Truck size={16} color="#10b981" />
                    </div>
                    <div className="vehicle-marker" style={{ top: '80%', left: '20%' }}>
                        <Truck size={16} color="#6b7280" />
                    </div>

                    {/* Delivery points */}
                    <div className="delivery-marker" style={{ top: '20%', left: '60%' }}>
                        <MapPin size={12} color="#ef4444" />
                    </div>
                    <div className="delivery-marker" style={{ top: '45%', left: '40%' }}>
                        <MapPin size={12} color="#ef4444" />
                    </div>
                    <div className="delivery-marker" style={{ top: '70%', left: '80%' }}>
                        <MapPin size={12} color="#ef4444" />
                    </div>
                </div>
            </div>

            {/* Vehicle status list */}
            <div className="vehicle-status-list">
                <h4>Vehículos Activos</h4>
                <div className="vehicle-list">
                    {vehicles.map((vehicle) => (
                        <div key={vehicle.id} className="vehicle-item">
                            <div className="vehicle-header">
                                <div className="vehicle-id">
                                    <Truck size={16} color={getStatusColor(vehicle.status)} />
                                    <span>{vehicle.id}</span>
                                </div>
                                <div
                                    className="vehicle-status"
                                    style={{ color: getStatusColor(vehicle.status) }}
                                >
                                    {getStatusText(vehicle.status)}
                                </div>
                            </div>

                            <div className="vehicle-details">
                                <p className="driver-name">{vehicle.driver}</p>
                                <div className="location-info">
                                    <div className="current-location">
                                        <MapPin size={12} />
                                        <span>{vehicle.currentStop}</span>
                                    </div>
                                    {vehicle.nextStop !== '-' && (
                                        <div className="next-location">
                                            <Navigation size={12} />
                                            <span>Próximo: {vehicle.nextStop}</span>
                                        </div>
                                    )}
                                </div>

                                {vehicle.progress > 0 && (
                                    <div className="progress-info">
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{
                                                    width: `${vehicle.progress}%`,
                                                    backgroundColor: getStatusColor(vehicle.status)
                                                }}
                                            />
                                        </div>
                                        <span className="eta">ETA: {vehicle.eta}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LiveMap;
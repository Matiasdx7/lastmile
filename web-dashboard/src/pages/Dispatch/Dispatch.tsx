import React, { useState } from 'react';
import './Dispatch.css';

// Mock data for vehicles
const mockVehicles = [
  {
    id: 'VEH-001',
    type: 'van',
    driver: 'Roberto Gómez',
    phone: '+54 11 5555-1234',
    status: 'in-transit',
    location: { x: 150, y: 200 },
    route: 'RUT-101',
    nextStop: 'Av. Libertador 1234, CABA',
    eta: '15 min',
    lastUpdate: '2 min ago'
  },
  {
    id: 'VEH-002',
    type: 'motorcycle',
    driver: 'Laura Fernández',
    phone: '+54 11 5555-5678',
    status: 'in-transit',
    location: { x: 300, y: 150 },
    route: 'RUT-102',
    nextStop: 'Calle Corrientes 567, CABA',
    eta: '8 min',
    lastUpdate: '1 min ago'
  },
  {
    id: 'VEH-003',
    type: 'truck',
    driver: 'Miguel Torres',
    phone: '+54 11 5555-9012',
    status: 'in-transit',
    location: { x: 450, y: 300 },
    route: 'RUT-103',
    nextStop: 'Av. Santa Fe 890, CABA',
    eta: '22 min',
    lastUpdate: '5 min ago'
  },
  {
    id: 'VEH-004',
    type: 'van',
    driver: 'Sofía López',
    phone: '+54 11 5555-3456',
    status: 'loading',
    location: { x: 600, y: 100 },
    route: 'RUT-104',
    nextStop: 'Centro de Distribución',
    eta: 'N/A',
    lastUpdate: '10 min ago'
  },
  {
    id: 'VEH-005',
    type: 'motorcycle',
    driver: 'Diego Ramírez',
    phone: '+54 11 5555-7890',
    status: 'available',
    location: { x: 700, y: 250 },
    route: 'N/A',
    nextStop: 'N/A',
    eta: 'N/A',
    lastUpdate: '15 min ago'
  }
];

// Mock data for pending dispatches
const mockPendingDispatches = [
  {
    id: 'DISP-001',
    route: 'RUT-105',
    stops: 8,
    packages: 12,
    priority: 'high',
    readyTime: '10:30 AM',
    assignedTo: null
  },
  {
    id: 'DISP-002',
    route: 'RUT-106',
    stops: 5,
    packages: 7,
    priority: 'medium',
    readyTime: '11:15 AM',
    assignedTo: null
  },
  {
    id: 'DISP-003',
    route: 'RUT-107',
    stops: 10,
    packages: 15,
    priority: 'low',
    readyTime: '12:00 PM',
    assignedTo: null
  }
];

// Mock data for active deliveries
const mockActiveDeliveries = [
  {
    id: 'DEL-7829',
    orderId: 'ORD-7829',
    customer: 'Juan Pérez',
    address: 'Av. Libertador 1234, CABA',
    status: 'in-transit',
    vehicle: 'VEH-001',
    driver: 'Roberto Gómez',
    eta: '15 min'
  },
  {
    id: 'DEL-7830',
    orderId: 'ORD-7830',
    customer: 'María González',
    address: 'Calle Corrientes 567, CABA',
    status: 'in-transit',
    vehicle: 'VEH-002',
    driver: 'Laura Fernández',
    eta: '8 min'
  },
  {
    id: 'DEL-7831',
    orderId: 'ORD-7831',
    customer: 'Carlos Rodríguez',
    address: 'Av. Santa Fe 890, CABA',
    status: 'in-transit',
    vehicle: 'VEH-003',
    driver: 'Miguel Torres',
    eta: '22 min'
  },
  {
    id: 'DEL-7832',
    orderId: 'ORD-7832',
    customer: 'Ana Martínez',
    address: 'Calle Florida 123, CABA',
    status: 'delayed',
    vehicle: 'VEH-001',
    driver: 'Roberto Gómez',
    eta: '35 min'
  }
];

// Mock data for alerts
const mockAlerts = [
  {
    id: 'ALT-001',
    type: 'delay',
    vehicle: 'VEH-001',
    message: 'Vehículo retrasado por tráfico',
    time: '10:45 AM',
    severity: 'medium'
  },
  {
    id: 'ALT-002',
    type: 'deviation',
    vehicle: 'VEH-002',
    message: 'Desviación de ruta detectada',
    time: '11:20 AM',
    severity: 'low'
  },
  {
    id: 'ALT-003',
    type: 'issue',
    vehicle: 'VEH-003',
    message: 'Problema mecánico reportado',
    time: '11:35 AM',
    severity: 'high'
  }
];

const Dispatch: React.FC = () => {
  const [activeTab, setActiveTab] = useState('map');
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [showVehicleInfo, setShowVehicleInfo] = useState(false);
  const [vehicleInfoPosition, setVehicleInfoPosition] = useState({ x: 0, y: 0 });
  
  // Handle vehicle marker click
  const handleVehicleClick = (vehicleId: string, x: number, y: number) => {
    setSelectedVehicle(vehicleId);
    setVehicleInfoPosition({ x, y });
    setShowVehicleInfo(true);
  };
  
  // Get selected vehicle data
  const getSelectedVehicleData = () => {
    return mockVehicles.find(v => v.id === selectedVehicle);
  };
  
  return (
    <div className="dispatch-container">
      <div className="dispatch-header">
        <h1>Centro de Despacho</h1>
        <div className="dispatch-actions">
          <button className="dispatch-button success">
            <i className="fas fa-plus"></i> Nuevo Despacho
          </button>
          <button className="dispatch-button">
            <i className="fas fa-sync"></i> Actualizar
          </button>
        </div>
      </div>
      
      <div className="dispatch-stats">
        <div className="stat-card">
          <div className="stat-label">Vehículos Activos</div>
          <div className="stat-value">18</div>
          <div className="stat-trend trend-up">↑ 2 desde ayer</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Entregas Hoy</div>
          <div className="stat-value">42</div>
          <div className="stat-trend trend-up">↑ 8 desde ayer</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tiempo Promedio</div>
          <div className="stat-value">28m</div>
          <div className="stat-trend trend-down">↓ 3m desde ayer</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tasa de Éxito</div>
          <div className="stat-value">96%</div>
          <div className="stat-trend trend-up">↑ 2% desde ayer</div>
        </div>
      </div>
      
      <div className="dispatch-tabs">
        <div 
          className={`dispatch-tab ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          Mapa de Despacho
        </div>
        <div 
          className={`dispatch-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Despachos Pendientes
        </div>
        <div 
          className={`dispatch-tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Entregas Activas
        </div>
        <div 
          className={`dispatch-tab ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          Alertas <span className="alert-badge">3</span>
        </div>
      </div>
      
      <div className={`dispatch-tab-content ${activeTab === 'map' ? 'active' : ''}`}>
        <div className="dispatch-filters">
          <div className="filter-group">
            <label className="filter-label">Tipo de Vehículo</label>
            <select className="filter-select">
              <option value="all">Todos</option>
              <option value="van">Camionetas</option>
              <option value="truck">Camiones</option>
              <option value="motorcycle">Motocicletas</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Estado</label>
            <select className="filter-select">
              <option value="all">Todos</option>
              <option value="in-transit">En Tránsito</option>
              <option value="loading">Cargando</option>
              <option value="available">Disponible</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Buscar</label>
            <input type="text" className="search-box" placeholder="ID, conductor, ruta..." />
          </div>
        </div>
        
        <div className="dispatch-map">
          <div className="map-placeholder">
            {/* Vehicle markers */}
            {mockVehicles.map(vehicle => (
              <div 
                key={vehicle.id}
                className={`vehicle-marker ${vehicle.type}`}
                style={{ left: `${vehicle.location.x}px`, top: `${vehicle.location.y}px` }}
                onClick={() => handleVehicleClick(vehicle.id, vehicle.location.x, vehicle.location.y)}
              >
                {vehicle.id.slice(-1)}
              </div>
            ))}
            
            {/* Vehicle info popup */}
            {showVehicleInfo && selectedVehicle && (
              <div 
                className="vehicle-info"
                style={{ 
                  left: `${vehicleInfoPosition.x + 20}px`, 
                  top: `${vehicleInfoPosition.y - 30}px` 
                }}
              >
                <button 
                  className="vehicle-info-close"
                  onClick={() => setShowVehicleInfo(false)}
                >
                  ×
                </button>
                <h4>{getSelectedVehicleData()?.id}</h4>
                <p><strong>Conductor:</strong> {getSelectedVehicleData()?.driver}</p>
                <p><strong>Teléfono:</strong> {getSelectedVehicleData()?.phone}</p>
                <p><strong>Estado:</strong> {
                  getSelectedVehicleData()?.status === 'in-transit' ? 'En Tránsito' :
                  getSelectedVehicleData()?.status === 'loading' ? 'Cargando' : 'Disponible'
                }</p>
                <p><strong>Ruta:</strong> {getSelectedVehicleData()?.route}</p>
                <p><strong>Próxima Parada:</strong> {getSelectedVehicleData()?.nextStop}</p>
                <p><strong>ETA:</strong> {getSelectedVehicleData()?.eta}</p>
                <p><strong>Última Actualización:</strong> {getSelectedVehicleData()?.lastUpdate}</p>
                <div style={{ marginTop: '10px' }}>
                  <button className="dispatch-action-button">Contactar</button>
                  <button className="dispatch-action-button warning">Rastrear</button>
                </div>
              </div>
            )}
          </div>
          
          <div className="map-controls">
            <button className="map-control-button">+</button>
            <button className="map-control-button">-</button>
            <button className="map-control-button">⟳</button>
          </div>
        </div>
        
        <div className="dispatch-grid">
          <div className="dispatch-card">
            <h3>Vehículos En Tránsito <span className="dispatch-card-count">3</span></h3>
            <ul className="dispatch-list">
              {mockVehicles
                .filter(v => v.status === 'in-transit')
                .map(vehicle => (
                  <li 
                    key={vehicle.id} 
                    className="dispatch-list-item"
                    onClick={() => handleVehicleClick(vehicle.id, vehicle.location.x, vehicle.location.y)}
                  >
                    <div className="dispatch-list-item-header">
                      <span className="dispatch-list-item-title">{vehicle.id}</span>
                      <span className="dispatch-list-item-status status-in-transit">En Tránsito</span>
                    </div>
                    <div className="dispatch-list-item-details">
                      <div>{vehicle.driver} • Ruta: {vehicle.route}</div>
                      <div>Próxima parada: {vehicle.nextStop}</div>
                      <div>ETA: {vehicle.eta}</div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
          
          <div className="dispatch-card">
            <h3>Vehículos Disponibles <span className="dispatch-card-count">1</span></h3>
            <ul className="dispatch-list">
              {mockVehicles
                .filter(v => v.status === 'available')
                .map(vehicle => (
                  <li 
                    key={vehicle.id} 
                    className="dispatch-list-item"
                    onClick={() => handleVehicleClick(vehicle.id, vehicle.location.x, vehicle.location.y)}
                  >
                    <div className="dispatch-list-item-header">
                      <span className="dispatch-list-item-title">{vehicle.id}</span>
                      <span className="dispatch-list-item-status status-delivered">Disponible</span>
                    </div>
                    <div className="dispatch-list-item-details">
                      <div>{vehicle.driver}</div>
                      <div>Tipo: {
                        vehicle.type === 'van' ? 'Camioneta' :
                        vehicle.type === 'truck' ? 'Camión' : 'Motocicleta'
                      }</div>
                      <div>Última actualización: {vehicle.lastUpdate}</div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
          
          <div className="dispatch-card">
            <h3>Alertas Activas <span className="dispatch-card-count">3</span></h3>
            <ul className="dispatch-list">
              {mockAlerts.map(alert => (
                <li key={alert.id} className="dispatch-list-item">
                  <div className="dispatch-list-item-header">
                    <span className="dispatch-list-item-title">{alert.vehicle}</span>
                    <span className={`dispatch-list-item-status ${
                      alert.severity === 'high' ? 'status-delayed' :
                      alert.severity === 'medium' ? 'status-pending' : 'status-in-transit'
                    }`}>
                      {alert.severity === 'high' ? 'Alta' :
                       alert.severity === 'medium' ? 'Media' : 'Baja'}
                    </span>
                  </div>
                  <div className="dispatch-list-item-details">
                    <div>{alert.message}</div>
                    <div>Hora: {alert.time}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      <div className={`dispatch-tab-content ${activeTab === 'pending' ? 'active' : ''}`}>
        <div className="dispatch-filters">
          <div className="filter-group">
            <label className="filter-label">Prioridad</label>
            <select className="filter-select">
              <option value="all">Todas</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Buscar</label>
            <input type="text" className="search-box" placeholder="ID, ruta..." />
          </div>
        </div>
        
        <table className="dispatch-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ruta</th>
              <th>Paradas</th>
              <th>Paquetes</th>
              <th>Prioridad</th>
              <th>Listo desde</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {mockPendingDispatches.map(dispatch => (
              <tr key={dispatch.id}>
                <td>{dispatch.id}</td>
                <td>{dispatch.route}</td>
                <td>{dispatch.stops}</td>
                <td>{dispatch.packages}</td>
                <td>
                  <span className={`dispatch-list-item-status ${
                    dispatch.priority === 'high' ? 'status-delayed' :
                    dispatch.priority === 'medium' ? 'status-pending' : 'status-in-transit'
                  }`}>
                    {dispatch.priority === 'high' ? 'Alta' :
                     dispatch.priority === 'medium' ? 'Media' : 'Baja'}
                  </span>
                </td>
                <td>{dispatch.readyTime}</td>
                <td>
                  <button className="dispatch-action-button">Ver</button>
                  <button className="dispatch-action-button success">Asignar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className={`dispatch-tab-content ${activeTab === 'active' ? 'active' : ''}`}>
        <div className="dispatch-filters">
          <div className="filter-group">
            <label className="filter-label">Estado</label>
            <select className="filter-select">
              <option value="all">Todos</option>
              <option value="in-transit">En Tránsito</option>
              <option value="delayed">Retrasado</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Vehículo</label>
            <select className="filter-select">
              <option value="all">Todos</option>
              {mockVehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>{vehicle.id}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Buscar</label>
            <input type="text" className="search-box" placeholder="ID, cliente, dirección..." />
          </div>
        </div>
        
        <table className="dispatch-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Orden</th>
              <th>Cliente</th>
              <th>Dirección</th>
              <th>Estado</th>
              <th>Vehículo</th>
              <th>Conductor</th>
              <th>ETA</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {mockActiveDeliveries.map(delivery => (
              <tr key={delivery.id}>
                <td>{delivery.id}</td>
                <td>{delivery.orderId}</td>
                <td>{delivery.customer}</td>
                <td>{delivery.address}</td>
                <td>
                  <span className={`dispatch-list-item-status ${
                    delivery.status === 'in-transit' ? 'status-in-transit' : 'status-delayed'
                  }`}>
                    {delivery.status === 'in-transit' ? 'En Tránsito' : 'Retrasado'}
                  </span>
                </td>
                <td>{delivery.vehicle}</td>
                <td>{delivery.driver}</td>
                <td>{delivery.eta}</td>
                <td>
                  <button className="dispatch-action-button">Ver</button>
                  <button className="dispatch-action-button warning">Rastrear</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className={`dispatch-tab-content ${activeTab === 'alerts' ? 'active' : ''}`}>
        <div className="dispatch-filters">
          <div className="filter-group">
            <label className="filter-label">Severidad</label>
            <select className="filter-select">
              <option value="all">Todas</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Tipo</label>
            <select className="filter-select">
              <option value="all">Todos</option>
              <option value="delay">Retraso</option>
              <option value="deviation">Desviación</option>
              <option value="issue">Problema</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Buscar</label>
            <input type="text" className="search-box" placeholder="ID, vehículo, mensaje..." />
          </div>
        </div>
        
        <table className="dispatch-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tipo</th>
              <th>Vehículo</th>
              <th>Mensaje</th>
              <th>Hora</th>
              <th>Severidad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {mockAlerts.map(alert => (
              <tr key={alert.id}>
                <td>{alert.id}</td>
                <td>{
                  alert.type === 'delay' ? 'Retraso' :
                  alert.type === 'deviation' ? 'Desviación' : 'Problema'
                }</td>
                <td>{alert.vehicle}</td>
                <td>{alert.message}</td>
                <td>{alert.time}</td>
                <td>
                  <span className={`dispatch-list-item-status ${
                    alert.severity === 'high' ? 'status-delayed' :
                    alert.severity === 'medium' ? 'status-pending' : 'status-in-transit'
                  }`}>
                    {alert.severity === 'high' ? 'Alta' :
                     alert.severity === 'medium' ? 'Media' : 'Baja'}
                  </span>
                </td>
                <td>
                  <button className="dispatch-action-button">Ver</button>
                  <button className="dispatch-action-button success">Resolver</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dispatch;
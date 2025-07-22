import React, { useState } from 'react';
import './Vehicles.css';

// Mock data for vehicles
const mockVehicles = [
  {
    id: 'VEH-001',
    plate: 'ABC 123',
    type: 'van',
    model: 'Mercedes-Benz Sprinter',
    year: 2023,
    capacity: '1200 kg',
    dimensions: '5.9m x 2.0m x 2.8m',
    status: 'active',
    driver: 'Roberto Gómez',
    lastMaintenance: '15/06/2025',
    nextMaintenance: '15/09/2025',
    fuelType: 'Diesel',
    fuelEfficiency: '9.5 L/100km',
    mileage: '15,230 km',
    purchaseDate: '10/01/2023',
    purchaseCost: '$45,000',
    image: 'https://via.placeholder.com/300x200?text=Mercedes+Sprinter'
  },
  {
    id: 'VEH-002',
    plate: 'DEF 456',
    type: 'motorcycle',
    model: 'Honda CG 150',
    year: 2024,
    capacity: '25 kg',
    dimensions: '2.0m x 0.8m x 1.1m',
    status: 'active',
    driver: 'Laura Fernández',
    lastMaintenance: '05/07/2025',
    nextMaintenance: '05/10/2025',
    fuelType: 'Gasolina',
    fuelEfficiency: '2.5 L/100km',
    mileage: '8,750 km',
    purchaseDate: '15/03/2024',
    purchaseCost: '$3,500',
    image: 'https://via.placeholder.com/300x200?text=Honda+CG+150'
  },
  {
    id: 'VEH-003',
    plate: 'GHI 789',
    type: 'truck',
    model: 'Iveco Daily',
    year: 2022,
    capacity: '3500 kg',
    dimensions: '7.2m x 2.3m x 3.0m',
    status: 'maintenance',
    driver: 'Miguel Torres',
    lastMaintenance: '01/07/2025',
    nextMaintenance: '01/08/2025',
    fuelType: 'Diesel',
    fuelEfficiency: '12.5 L/100km',
    mileage: '32,450 km',
    purchaseDate: '20/05/2022',
    purchaseCost: '$65,000',
    image: 'https://via.placeholder.com/300x200?text=Iveco+Daily'
  },
  {
    id: 'VEH-004',
    plate: 'JKL 012',
    type: 'van',
    model: 'Renault Kangoo',
    year: 2023,
    capacity: '800 kg',
    dimensions: '4.3m x 1.8m x 1.8m',
    status: 'active',
    driver: 'Sofía López',
    lastMaintenance: '20/06/2025',
    nextMaintenance: '20/09/2025',
    fuelType: 'Gasolina',
    fuelEfficiency: '7.8 L/100km',
    mileage: '18,900 km',
    purchaseDate: '05/08/2023',
    purchaseCost: '$28,000',
    image: 'https://via.placeholder.com/300x200?text=Renault+Kangoo'
  },
  {
    id: 'VEH-005',
    plate: 'MNO 345',
    type: 'motorcycle',
    model: 'Yamaha YBR 125',
    year: 2024,
    capacity: '20 kg',
    dimensions: '1.9m x 0.8m x 1.0m',
    status: 'active',
    driver: 'Diego Ramírez',
    lastMaintenance: '10/07/2025',
    nextMaintenance: '10/10/2025',
    fuelType: 'Gasolina',
    fuelEfficiency: '2.2 L/100km',
    mileage: '5,600 km',
    purchaseDate: '12/02/2024',
    purchaseCost: '$3,200',
    image: 'https://via.placeholder.com/300x200?text=Yamaha+YBR+125'
  },
  {
    id: 'VEH-006',
    plate: 'PQR 678',
    type: 'van',
    model: 'Fiat Ducato',
    year: 2022,
    capacity: '1500 kg',
    dimensions: '6.0m x 2.1m x 2.5m',
    status: 'inactive',
    driver: 'No asignado',
    lastMaintenance: '25/05/2025',
    nextMaintenance: '25/08/2025',
    fuelType: 'Diesel',
    fuelEfficiency: '10.2 L/100km',
    mileage: '28,750 km',
    purchaseDate: '18/11/2022',
    purchaseCost: '$38,000',
    image: 'https://via.placeholder.com/300x200?text=Fiat+Ducato'
  }
];

// Mock data for maintenance records
const mockMaintenanceRecords = [
  {
    id: 'MANT-001',
    vehicleId: 'VEH-003',
    vehiclePlate: 'GHI 789',
    type: 'corrective',
    description: 'Reparación de sistema de frenos',
    date: '01/07/2025',
    cost: '$850',
    technician: 'Carlos Méndez',
    status: 'in-progress',
    estimatedCompletion: '05/07/2025'
  },
  {
    id: 'MANT-002',
    vehicleId: 'VEH-001',
    vehiclePlate: 'ABC 123',
    type: 'preventive',
    description: 'Cambio de aceite y filtros',
    date: '15/06/2025',
    cost: '$320',
    technician: 'Ana Rodríguez',
    status: 'completed',
    estimatedCompletion: 'N/A'
  }
];

const Vehicles: React.FC = () => {
  const [activeTab, setActiveTab] = useState('fleet');
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  
  // Get vehicle data by ID
  const getVehicleById = (id: string) => {
    return mockVehicles.find(v => v.id === id);
  };
  
  // Render vehicle detail view
  const renderVehicleDetail = () => {
    const vehicle = getVehicleById(selectedVehicle!);
    if (!vehicle) return null;
    
    return (
      <div className="vehicle-detail">
        <div className="vehicle-detail-header">
          <img src={vehicle.image} alt={vehicle.model} className="vehicle-detail-image" />
          <div className="vehicle-detail-info">
            <div className="vehicle-detail-title">
              <span>{vehicle.model} ({vehicle.year})</span>
              <span className={`vehicle-card-status status-${vehicle.status}`}>
                {vehicle.status === 'active' ? 'Activo' : 
                 vehicle.status === 'maintenance' ? 'En Mantenimiento' : 'Inactivo'}
              </span>
            </div>
            <div className="vehicle-detail-subtitle">
              {vehicle.id} • {vehicle.plate} • {
                vehicle.type === 'van' ? 'Camioneta' :
                vehicle.type === 'truck' ? 'Camión' : 'Motocicleta'
              }
            </div>
            
            <div className="vehicle-detail-stats">
              <div className="vehicle-stat">
                <div className="vehicle-stat-value">{vehicle.capacity}</div>
                <div className="vehicle-stat-label">Capacidad</div>
              </div>
              <div className="vehicle-stat">
                <div className="vehicle-stat-value">{vehicle.mileage}</div>
                <div className="vehicle-stat-label">Kilometraje</div>
              </div>
              <div className="vehicle-stat">
                <div className="vehicle-stat-value">{vehicle.fuelEfficiency}</div>
                <div className="vehicle-stat-label">Consumo</div>
              </div>
            </div>
            
            <div className="vehicle-detail-actions">
              <button className="vehicles-button">Editar</button>
              <button className="vehicles-button warning">Programar Mantenimiento</button>
              {vehicle.status === 'active' ? (
                <button className="vehicles-button danger">Marcar como Inactivo</button>
              ) : (
                <button className="vehicles-button success">Marcar como Activo</button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render fleet overview
  const renderFleetOverview = () => {
    return (
      <>
        <div className="vehicles-stats">
          <div className="stat-card">
            <div className="stat-label">Total de Vehículos</div>
            <div className="stat-value">24</div>
            <div className="stat-trend trend-up">↑ 2 desde el mes pasado</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Vehículos Activos</div>
            <div className="stat-value">20</div>
            <div className="stat-trend trend-up">↑ 1 desde el mes pasado</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">En Mantenimiento</div>
            <div className="stat-value">3</div>
            <div className="stat-trend trend-down">↓ 1 desde el mes pasado</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Inactivos</div>
            <div className="stat-value">1</div>
            <div className="stat-trend">Sin cambios</div>
          </div>
        </div>
        
        <div className="vehicles-filters">
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
              <option value="active">Activos</option>
              <option value="maintenance">En Mantenimiento</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Buscar</label>
            <input type="text" className="search-box" placeholder="ID, placa, modelo..." />
          </div>
        </div>
        
        <div className="vehicles-grid">
          {mockVehicles.map(vehicle => (
            <div key={vehicle.id} className="vehicle-card">
              <div className="vehicle-card-header">
                <span className="vehicle-card-title">{vehicle.id}</span>
                <span className={`vehicle-card-status status-${vehicle.status}`}>
                  {vehicle.status === 'active' ? 'Activo' : 
                   vehicle.status === 'maintenance' ? 'En Mantenimiento' : 'Inactivo'}
                </span>
              </div>
              <img src={vehicle.image} alt={vehicle.model} className="vehicle-card-image" />
              <div className="vehicle-card-body">
                <div className="vehicle-info-row">
                  <span className="vehicle-info-label">Modelo</span>
                  <span className="vehicle-info-value">{vehicle.model}</span>
                </div>
                <div className="vehicle-info-row">
                  <span className="vehicle-info-label">Placa</span>
                  <span className="vehicle-info-value">{vehicle.plate}</span>
                </div>
                <div className="vehicle-info-row">
                  <span className="vehicle-info-label">Tipo</span>
                  <span className="vehicle-info-value">
                    {vehicle.type === 'van' ? 'Camioneta' :
                     vehicle.type === 'truck' ? 'Camión' : 'Motocicleta'}
                  </span>
                </div>
                <div className="vehicle-info-row">
                  <span className="vehicle-info-label">Conductor</span>
                  <span className="vehicle-info-value">{vehicle.driver}</span>
                </div>
                <div className="vehicle-info-row">
                  <span className="vehicle-info-label">Próx. Mantenimiento</span>
                  <span className="vehicle-info-value">{vehicle.nextMaintenance}</span>
                </div>
              </div>
              <div className="vehicle-card-footer">
                <button 
                  className="vehicle-action-button"
                  onClick={() => setSelectedVehicle(vehicle.id)}
                >
                  Ver Detalles
                </button>
                <button className="vehicle-action-button warning">Mantenimiento</button>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };
  
  return (
    <div className="vehicles-container">
      {selectedVehicle ? (
        <>
          <div className="vehicles-header">
            <h1>Detalles del Vehículo</h1>
            <button 
              className="vehicles-button"
              onClick={() => setSelectedVehicle(null)}
            >
              Volver a la Lista
            </button>
          </div>
          {renderVehicleDetail()}
        </>
      ) : (
        <>
          <div className="vehicles-header">
            <h1>Gestión de Vehículos</h1>
            <div className="vehicles-actions">
              <button className="vehicles-button success">
                Agregar Vehículo
              </button>
              <button className="vehicles-button">
                Exportar
              </button>
            </div>
          </div>
          
          <div className="vehicles-tabs">
            <div 
              className={`vehicles-tab ${activeTab === 'fleet' ? 'active' : ''}`}
              onClick={() => setActiveTab('fleet')}
            >
              Flota
            </div>
            <div 
              className={`vehicles-tab ${activeTab === 'maintenance' ? 'active' : ''}`}
              onClick={() => setActiveTab('maintenance')}
            >
              Mantenimiento
            </div>
            <div 
              className={`vehicles-tab ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              Reportes
            </div>
          </div>
          
          <div className={`vehicles-tab-content ${activeTab === 'fleet' ? 'active' : ''}`}>
            {renderFleetOverview()}
          </div>
          
          <div className={`vehicles-tab-content ${activeTab === 'maintenance' ? 'active' : ''}`}>
            <h3>Mantenimientos en Progreso</h3>
            {mockMaintenanceRecords
              .filter(record => record.status === 'in-progress')
              .map(record => (
                <div key={record.id} className="maintenance-card">
                  <div className="maintenance-header">
                    <span className="maintenance-title">{record.id}</span>
                    <span className="maintenance-date">Fecha: {record.date}</span>
                  </div>
                  <div className="maintenance-vehicle">
                    <strong>Vehículo:</strong> {record.vehicleId} ({record.vehiclePlate})
                  </div>
                  <span className={`maintenance-type ${record.type}`}>
                    {record.type === 'preventive' ? 'Mantenimiento Preventivo' : 'Mantenimiento Correctivo'}
                  </span>
                  <div className="maintenance-description">
                    {record.description}
                  </div>
                </div>
              ))}
          </div>
          
          <div className={`vehicles-tab-content ${activeTab === 'reports' ? 'active' : ''}`}>
            <div className="chart-container">
              <div className="chart-header">
                <span className="chart-title">Costos de Mantenimiento por Vehículo</span>
                <span className="chart-period">Últimos 6 meses</span>
              </div>
              <div className="chart-placeholder">
                [Gráfico de costos de mantenimiento]
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Vehicles;
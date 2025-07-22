import React, { useState } from 'react';
import './BPM.css';

// Mock data for BPM processes
const mockProcesses = [
  {
    id: 'proc-001',
    name: 'Procesamiento de Pedidos',
    description: 'Flujo de trabajo para el procesamiento de pedidos desde la creación hasta la entrega',
    version: '1.0',
    status: 'active',
    steps: [
      { id: 'step-1', name: 'Recepción de Pedido', status: 'completed', completedAt: '2025-07-20T10:30:00Z' },
      { id: 'step-2', name: 'Validación de Pedido', status: 'completed', completedAt: '2025-07-20T10:35:00Z' },
      { id: 'step-3', name: 'Consolidación de Carga', status: 'completed', completedAt: '2025-07-20T11:15:00Z' },
      { id: 'step-4', name: 'Asignación de Vehículo', status: 'completed', completedAt: '2025-07-20T11:30:00Z' },
      { id: 'step-5', name: 'Planificación de Ruta', status: 'active', startedAt: '2025-07-20T11:45:00Z' },
      { id: 'step-6', name: 'Despacho', status: 'pending' },
      { id: 'step-7', name: 'En Tránsito', status: 'pending' },
      { id: 'step-8', name: 'Entrega', status: 'pending' },
      { id: 'step-9', name: 'Confirmación', status: 'pending' }
    ]
  },
  {
    id: 'proc-002',
    name: 'Gestión de Incidencias',
    description: 'Proceso para manejar incidencias durante la entrega',
    version: '1.1',
    status: 'active',
    steps: [
      { id: 'step-1', name: 'Reporte de Incidencia', status: 'completed', completedAt: '2025-07-20T13:15:00Z' },
      { id: 'step-2', name: 'Clasificación', status: 'completed', completedAt: '2025-07-20T13:20:00Z' },
      { id: 'step-3', name: 'Asignación de Responsable', status: 'active', startedAt: '2025-07-20T13:25:00Z' },
      { id: 'step-4', name: 'Resolución', status: 'pending' },
      { id: 'step-5', name: 'Verificación', status: 'pending' },
      { id: 'step-6', name: 'Cierre', status: 'pending' }
    ]
  },
  {
    id: 'proc-003',
    name: 'Mantenimiento de Vehículos',
    description: 'Proceso para el mantenimiento preventivo y correctivo de vehículos',
    version: '1.0',
    status: 'active',
    steps: [
      { id: 'step-1', name: 'Programación', status: 'completed', completedAt: '2025-07-19T09:00:00Z' },
      { id: 'step-2', name: 'Asignación de Taller', status: 'completed', completedAt: '2025-07-19T09:30:00Z' },
      { id: 'step-3', name: 'Recepción de Vehículo', status: 'completed', completedAt: '2025-07-19T10:00:00Z' },
      { id: 'step-4', name: 'Diagnóstico', status: 'completed', completedAt: '2025-07-19T11:00:00Z' },
      { id: 'step-5', name: 'Reparación/Mantenimiento', status: 'completed', completedAt: '2025-07-20T14:00:00Z' },
      { id: 'step-6', name: 'Control de Calidad', status: 'active', startedAt: '2025-07-20T14:30:00Z' },
      { id: 'step-7', name: 'Entrega de Vehículo', status: 'pending' }
    ]
  }
];

// Mock metrics data
const mockMetrics = {
  averageProcessTime: {
    'Procesamiento de Pedidos': '3h 45m',
    'Gestión de Incidencias': '2h 10m',
    'Mantenimiento de Vehículos': '29h 30m'
  },
  completionRate: {
    'Procesamiento de Pedidos': 78,
    'Gestión de Incidencias': 85,
    'Mantenimiento de Vehículos': 92
  },
  bottlenecks: [
    { process: 'Procesamiento de Pedidos', step: 'Planificación de Ruta', avgTime: '45m' },
    { process: 'Gestión de Incidencias', step: 'Asignación de Responsable', avgTime: '35m' },
    { process: 'Mantenimiento de Vehículos', step: 'Diagnóstico', avgTime: '1h 15m' }
  ]
};

const BPM: React.FC = () => {
  const [selectedProcess, setSelectedProcess] = useState<string>(mockProcesses[0].id);
  const [activeTab, setActiveTab] = useState<string>('diagram');
  
  const currentProcess = mockProcesses.find(p => p.id === selectedProcess);
  
  return (
    <div className="bpm-container">
      <h1>Gestión de Procesos BPM</h1>
      
      <div className="process-selector">
        <label htmlFor="process-select">Seleccionar Proceso:</label>
        <select 
          id="process-select" 
          value={selectedProcess} 
          onChange={(e) => setSelectedProcess(e.target.value)}
          className="form-select"
        >
          {mockProcesses.map(process => (
            <option key={process.id} value={process.id}>{process.name}</option>
          ))}
        </select>
      </div>
      
      {currentProcess && (
        <div className="process-details">
          <div className="process-header">
            <h2>{currentProcess.name}</h2>
            <span className={`status-badge ${currentProcess.status}`}>
              {currentProcess.status === 'active' ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          
          <p className="process-description">{currentProcess.description}</p>
          <p className="process-version">Versión: {currentProcess.version}</p>
          
          <div className="tabs">
            <button 
              className={`tab-button ${activeTab === 'diagram' ? 'active' : ''}`}
              onClick={() => setActiveTab('diagram')}
            >
              Diagrama de Proceso
            </button>
            <button 
              className={`tab-button ${activeTab === 'metrics' ? 'active' : ''}`}
              onClick={() => setActiveTab('metrics')}
            >
              Métricas
            </button>
            <button 
              className={`tab-button ${activeTab === 'instances' ? 'active' : ''}`}
              onClick={() => setActiveTab('instances')}
            >
              Instancias Activas
            </button>
          </div>
          
          <div className="tab-content">
            {activeTab === 'diagram' && (
              <div className="process-diagram">
                <div className="process-flow">
                  {currentProcess.steps.map((step, index) => (
                    <div key={step.id} className="process-step">
                      <div className={`step-node ${step.status}`}>
                        {index + 1}
                      </div>
                      <div className="step-details">
                        <div className="step-name">{step.name}</div>
                        <div className={`step-status ${step.status}`}>
                          {step.status === 'completed' ? 'Completado' : 
                           step.status === 'active' ? 'En Progreso' : 'Pendiente'}
                        </div>
                        {step.completedAt && (
                          <div className="step-time">
                            Completado: {new Date(step.completedAt).toLocaleString()}
                          </div>
                        )}
                        {step.startedAt && !step.completedAt && (
                          <div className="step-time">
                            Iniciado: {new Date(step.startedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                      {index < currentProcess.steps.length - 1 && (
                        <div className="step-connector"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'metrics' && (
              <div className="process-metrics">
                <div className="metrics-section">
                  <h3>Tiempo Promedio de Proceso</h3>
                  <div className="metrics-cards">
                    {Object.entries(mockMetrics.averageProcessTime).map(([process, time]) => (
                      <div key={process} className="metric-card">
                        <div className="metric-title">{process}</div>
                        <div className="metric-value">{time}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="metrics-section">
                  <h3>Tasa de Completado</h3>
                  <div className="metrics-cards">
                    {Object.entries(mockMetrics.completionRate).map(([process, rate]) => (
                      <div key={process} className="metric-card">
                        <div className="metric-title">{process}</div>
                        <div className="metric-value">{rate}%</div>
                        <div className="progress-bar">
                          <div className="progress" style={{ width: `${rate}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="metrics-section">
                  <h3>Cuellos de Botella Identificados</h3>
                  <table className="metrics-table">
                    <thead>
                      <tr>
                        <th>Proceso</th>
                        <th>Paso</th>
                        <th>Tiempo Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockMetrics.bottlenecks.map((bottleneck, index) => (
                        <tr key={index}>
                          <td>{bottleneck.process}</td>
                          <td>{bottleneck.step}</td>
                          <td>{bottleneck.avgTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {activeTab === 'instances' && (
              <div className="process-instances">
                <table className="instances-table">
                  <thead>
                    <tr>
                      <th>ID Instancia</th>
                      <th>Iniciado</th>
                      <th>Paso Actual</th>
                      <th>Tiempo en Paso</th>
                      <th>Asignado a</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>INST-7842</td>
                      <td>21/07/2025 10:30</td>
                      <td>Planificación de Ruta</td>
                      <td>15m</td>
                      <td>Carlos Rodríguez</td>
                      <td>
                        <button className="action-button">Ver</button>
                        <button className="action-button">Intervenir</button>
                      </td>
                    </tr>
                    <tr>
                      <td>INST-7843</td>
                      <td>21/07/2025 11:15</td>
                      <td>Asignación de Vehículo</td>
                      <td>5m</td>
                      <td>María González</td>
                      <td>
                        <button className="action-button">Ver</button>
                        <button className="action-button">Intervenir</button>
                      </td>
                    </tr>
                    <tr>
                      <td>INST-7844</td>
                      <td>21/07/2025 12:00</td>
                      <td>Validación de Pedido</td>
                      <td>3m</td>
                      <td>Ana Martínez</td>
                      <td>
                        <button className="action-button">Ver</button>
                        <button className="action-button">Intervenir</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BPM;
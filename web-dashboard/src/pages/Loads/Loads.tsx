import React from 'react';
import './Loads.css';

const Loads: React.FC = () => {
  return (
    <div className="loads-container">
      <div className="dashboard-cards">
        <div className="card">
          <h3>Cargas Totales</h3>
          <div className="card-value">32</div>
          <p>+5 desde la semana pasada</p>
        </div>
        <div className="card">
          <h3>Cargas Pendientes</h3>
          <div className="card-value">8</div>
          <p>25% del total</p>
        </div>
        <div className="card">
          <h3>Cargas Asignadas</h3>
          <div className="card-value">15</div>
          <p>47% del total</p>
        </div>
        <div className="card">
          <h3>Cargas Entregadas</h3>
          <div className="card-value">9</div>
          <p>28% del total</p>
        </div>
      </div>
      
      <div className="table-container">
        <h2>Cargas Pendientes de Asignación</h2>
        <table className="loads-table">
          <thead>
            <tr>
              <th>ID Carga</th>
              <th>Pedidos</th>
              <th>Peso Total</th>
              <th>Volumen</th>
              <th>Zona</th>
              <th>Fecha Límite</th>
              <th>Prioridad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>LOAD-001</td>
              <td>5 pedidos</td>
              <td>450 kg</td>
              <td>2.3 m³</td>
              <td>Norte</td>
              <td>22/07/2025</td>
              <td><span className="status-badge high">Alta</span></td>
              <td>
                <button className="action-button primary">Asignar</button>
              </td>
            </tr>
            <tr>
              <td>LOAD-002</td>
              <td>3 pedidos</td>
              <td>280 kg</td>
              <td>1.5 m³</td>
              <td>Sur</td>
              <td>22/07/2025</td>
              <td><span className="status-badge medium">Media</span></td>
              <td>
                <button className="action-button primary">Asignar</button>
              </td>
            </tr>
            <tr>
              <td>LOAD-003</td>
              <td>7 pedidos</td>
              <td>620 kg</td>
              <td>3.2 m³</td>
              <td>Este</td>
              <td>23/07/2025</td>
              <td><span className="status-badge medium">Media</span></td>
              <td>
                <button className="action-button primary">Asignar</button>
              </td>
            </tr>
            <tr>
              <td>LOAD-004</td>
              <td>4 pedidos</td>
              <td>350 kg</td>
              <td>1.8 m³</td>
              <td>Oeste</td>
              <td>23/07/2025</td>
              <td><span className="status-badge high">Alta</span></td>
              <td>
                <button className="action-button primary">Asignar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="table-container">
        <h2>Cargas Asignadas</h2>
        <table className="loads-table">
          <thead>
            <tr>
              <th>ID Carga</th>
              <th>Pedidos</th>
              <th>Vehículo</th>
              <th>Conductor</th>
              <th>Ruta</th>
              <th>Estado</th>
              <th>Progreso</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>LOAD-005</td>
              <td>6 pedidos</td>
              <td>VEH-001</td>
              <td>Roberto Gómez</td>
              <td>RUT-101</td>
              <td><span className="status-badge in-transit">En Tránsito</span></td>
              <td>3/6 entregas</td>
              <td>
                <button className="action-button secondary">Rastrear</button>
              </td>
            </tr>
            <tr>
              <td>LOAD-006</td>
              <td>4 pedidos</td>
              <td>VEH-002</td>
              <td>Laura Fernández</td>
              <td>RUT-102</td>
              <td><span className="status-badge in-transit">En Tránsito</span></td>
              <td>2/4 entregas</td>
              <td>
                <button className="action-button secondary">Rastrear</button>
              </td>
            </tr>
            <tr>
              <td>LOAD-007</td>
              <td>8 pedidos</td>
              <td>VEH-003</td>
              <td>Miguel Torres</td>
              <td>RUT-103</td>
              <td><span className="status-badge in-transit">En Tránsito</span></td>
              <td>5/8 entregas</td>
              <td>
                <button className="action-button secondary">Rastrear</button>
              </td>
            </tr>
            <tr>
              <td>LOAD-008</td>
              <td>5 pedidos</td>
              <td>VEH-004</td>
              <td>Sofía López</td>
              <td>RUT-104</td>
              <td><span className="status-badge delayed">Retrasado</span></td>
              <td>2/5 entregas</td>
              <td>
                <button className="action-button secondary">Rastrear</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="table-container">
        <h2>Detalle de Consolidación</h2>
        <table className="loads-table">
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Cliente</th>
              <th>Dirección</th>
              <th>Peso</th>
              <th>Volumen</th>
              <th>Ventana de Tiempo</th>
              <th>Compatibilidad</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ORD-7834</td>
              <td>Pedro Gómez</td>
              <td>Av. Cabildo 2500, CABA</td>
              <td>85 kg</td>
              <td>0.4 m³</td>
              <td>9:00 - 12:00</td>
              <td><span className="status-badge high">Alta</span></td>
            </tr>
            <tr>
              <td>ORD-7835</td>
              <td>Lucía Fernández</td>
              <td>Av. Cabildo 2650, CABA</td>
              <td>120 kg</td>
              <td>0.6 m³</td>
              <td>9:00 - 12:00</td>
              <td><span className="status-badge high">Alta</span></td>
            </tr>
            <tr>
              <td>ORD-7836</td>
              <td>Martín Rodríguez</td>
              <td>Av. Cabildo 2800, CABA</td>
              <td>95 kg</td>
              <td>0.5 m³</td>
              <td>9:00 - 12:00</td>
              <td><span className="status-badge high">Alta</span></td>
            </tr>
            <tr>
              <td>ORD-7837</td>
              <td>Carolina López</td>
              <td>Av. Cabildo 3000, CABA</td>
              <td>150 kg</td>
              <td>0.8 m³</td>
              <td>9:00 - 12:00</td>
              <td><span className="status-badge medium">Media</span></td>
            </tr>
            <tr>
              <td>ORD-7838</td>
              <td>Gabriel Martínez</td>
              <td>Av. Cabildo 3200, CABA</td>
              <td>75 kg</td>
              <td>0.3 m³</td>
              <td>9:00 - 12:00</td>
              <td><span className="status-badge high">Alta</span></td>
            </tr>
          </tbody>
        </table>
        
        <div className="action-container">
          <button className="action-button primary large">Consolidar Carga</button>
        </div>
      </div>
    </div>
  );
};

export default Loads;
import React, { useState } from 'react';
import './Orders.css';

// Mock data for orders
const mockOrders = [
  {
    id: 'ORD-7829',
    customer: 'Juan Pérez',
    address: 'Av. Libertador 1234, CABA',
    date: '21/07/2025 10:30',
    status: 'delivered',
    items: 3,
    total: '$1,250',
    priority: 'medium',
    assignedTo: 'Roberto Gómez'
  },
  {
    id: 'ORD-7830',
    customer: 'María González',
    address: 'Calle Corrientes 567, CABA',
    date: '21/07/2025 11:15',
    status: 'in-transit',
    items: 2,
    total: '$850',
    priority: 'high',
    assignedTo: 'Laura Fernández'
  },
  {
    id: 'ORD-7831',
    customer: 'Carlos Rodríguez',
    address: 'Av. Santa Fe 890, CABA',
    date: '21/07/2025 12:00',
    status: 'pending',
    items: 5,
    total: '$2,100',
    priority: 'medium',
    assignedTo: 'Miguel Torres'
  },
  {
    id: 'ORD-7832',
    customer: 'Ana Martínez',
    address: 'Calle Florida 123, CABA',
    date: '21/07/2025 13:45',
    status: 'pending',
    items: 1,
    total: '$450',
    priority: 'low',
    assignedTo: null
  },
  {
    id: 'ORD-7833',
    customer: 'Luis Sánchez',
    address: 'Av. Córdoba 456, CABA',
    date: '21/07/2025 14:30',
    status: 'delivered',
    items: 4,
    total: '$1,800',
    priority: 'medium',
    assignedTo: 'Roberto Gómez'
  },
  {
    id: 'ORD-7834',
    customer: 'Pedro Gómez',
    address: 'Av. Cabildo 2500, CABA',
    date: '21/07/2025 15:15',
    status: 'pending',
    items: 2,
    total: '$950',
    priority: 'high',
    assignedTo: null
  },
  {
    id: 'ORD-7835',
    customer: 'Lucía Fernández',
    address: 'Av. Cabildo 2650, CABA',
    date: '21/07/2025 16:00',
    status: 'pending',
    items: 3,
    total: '$1,350',
    priority: 'medium',
    assignedTo: null
  }
];

// Mock data for order details
const mockOrderDetails = {
  id: 'ORD-7830',
  customer: {
    name: 'María González',
    phone: '+54 11 5555-5678',
    email: 'maria.gonzalez@example.com'
  },
  address: {
    street: 'Calle Corrientes 567',
    city: 'CABA',
    state: 'Buenos Aires',
    zipCode: '1414',
    coordinates: {
      latitude: -34.603722,
      longitude: -58.381592
    }
  },
  date: '21/07/2025 11:15',
  deliveryWindow: {
    start: '14:00',
    end: '17:00'
  },
  status: 'in-transit',
  items: [
    {
      id: 'ITEM-001',
      description: 'Laptop Dell XPS 13',
      quantity: 1,
      weight: '1.5 kg',
      dimensions: '30cm x 20cm x 5cm',
      fragile: true,
      price: '$650'
    },
    {
      id: 'ITEM-002',
      description: 'Monitor LG 27"',
      quantity: 1,
      weight: '4.2 kg',
      dimensions: '65cm x 45cm x 15cm',
      fragile: true,
      price: '$200'
    }
  ],
  total: '$850',
  priority: 'high',
  specialInstructions: 'Llamar al cliente antes de entregar. No dejar con el portero.',
  assignedTo: 'Laura Fernández',
  vehicle: 'VEH-002',
  estimatedDelivery: '15:30',
  history: [
    {
      timestamp: '21/07/2025 11:15',
      status: 'created',
      description: 'Pedido creado'
    },
    {
      timestamp: '21/07/2025 11:30',
      status: 'confirmed',
      description: 'Pedido confirmado'
    },
    {
      timestamp: '21/07/2025 12:45',
      status: 'processing',
      description: 'Pedido en procesamiento'
    },
    {
      timestamp: '21/07/2025 13:30',
      status: 'assigned',
      description: 'Asignado a Laura Fernández (VEH-002)'
    },
    {
      timestamp: '21/07/2025 14:15',
      status: 'in-transit',
      description: 'En tránsito hacia el destino'
    }
  ]
};

const Orders: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter orders based on active tab and search term
  const filteredOrders = mockOrders.filter(order => {
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'pending' && order.status === 'pending') ||
      (activeTab === 'in-transit' && order.status === 'in-transit') ||
      (activeTab === 'delivered' && order.status === 'delivered');
    
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesTab && matchesSearch;
  });
  
  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in-transit': return 'En Tránsito';
      case 'delivered': return 'Entregado';
      default: return status;
    }
  };
  
  // Get priority label
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return priority;
    }
  };
  
  // Render order list
  const renderOrderList = () => {
    return (
      <>
        <div className="orders-header">
          <h1>Gestión de Pedidos</h1>
          <button className="action-button primary">Nuevo Pedido</button>
        </div>
        
        <div className="dashboard-cards">
          <div className="card">
            <h3>Pedidos Totales</h3>
            <div className="card-value">248</div>
            <p>+12% desde la semana pasada</p>
          </div>
          <div className="card">
            <h3>Pedidos Pendientes</h3>
            <div className="card-value">61</div>
            <p>25% del total</p>
          </div>
          <div className="card">
            <h3>En Tránsito</h3>
            <div className="card-value">42</div>
            <p>17% del total</p>
          </div>
          <div className="card">
            <h3>Entregados Hoy</h3>
            <div className="card-value">145</div>
            <p>58% del total</p>
          </div>
        </div>
        
        <div className="orders-tabs">
          <div 
            className={`orders-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Todos
          </div>
          <div 
            className={`orders-tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pendientes
          </div>
          <div 
            className={`orders-tab ${activeTab === 'in-transit' ? 'active' : ''}`}
            onClick={() => setActiveTab('in-transit')}
          >
            En Tránsito
          </div>
          <div 
            className={`orders-tab ${activeTab === 'delivered' ? 'active' : ''}`}
            onClick={() => setActiveTab('delivered')}
          >
            Entregados
          </div>
        </div>
        
        <div className="orders-filters">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Buscar por ID, cliente o dirección..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Prioridad</label>
            <select>
              <option value="all">Todas</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Fecha</label>
            <select>
              <option value="today">Hoy</option>
              <option value="yesterday">Ayer</option>
              <option value="last-week">Última Semana</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
        </div>
        
        <div className="table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>ID Pedido</th>
                <th>Cliente</th>
                <th>Dirección</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Items</th>
                <th>Total</th>
                <th>Prioridad</th>
                <th>Asignado a</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer}</td>
                  <td>{order.address}</td>
                  <td>{order.date}</td>
                  <td>
                    <span className={`status-badge ${order.status}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td>{order.items}</td>
                  <td>{order.total}</td>
                  <td>
                    <span className={`priority-badge ${order.priority}`}>
                      {getPriorityLabel(order.priority)}
                    </span>
                  </td>
                  <td>{order.assignedTo || 'No asignado'}</td>
                  <td>
                    <button 
                      className="action-button primary"
                      onClick={() => setSelectedOrder(order.id)}
                    >
                      Ver
                    </button>
                    <button className="action-button secondary">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="pagination">
          <button className="pagination-button">«</button>
          <button className="pagination-button active">1</button>
          <button className="pagination-button">2</button>
          <button className="pagination-button">3</button>
          <button className="pagination-button">»</button>
        </div>
      </>
    );
  };
  
  // Render order details
  const renderOrderDetails = () => {
    return (
      <>
        <div className="orders-header">
          <div className="header-with-back">
            <button 
              className="back-button"
              onClick={() => setSelectedOrder(null)}
            >
              ← Volver
            </button>
            <h1>Detalles del Pedido {mockOrderDetails.id}</h1>
          </div>
          <div>
            <button className="action-button secondary">Editar</button>
            <button className="action-button primary">Asignar</button>
          </div>
        </div>
        
        <div className="order-details-container">
          <div className="order-details-section">
            <h2>Información del Pedido</h2>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">ID Pedido</span>
                <span className="detail-value">{mockOrderDetails.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Fecha</span>
                <span className="detail-value">{mockOrderDetails.date}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Estado</span>
                <span className="detail-value">
                  <span className={`status-badge ${mockOrderDetails.status}`}>
                    {getStatusLabel(mockOrderDetails.status)}
                  </span>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Prioridad</span>
                <span className="detail-value">
                  <span className={`priority-badge ${mockOrderDetails.priority}`}>
                    {getPriorityLabel(mockOrderDetails.priority)}
                  </span>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Ventana de Entrega</span>
                <span className="detail-value">
                  {mockOrderDetails.deliveryWindow.start} - {mockOrderDetails.deliveryWindow.end}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Entrega Estimada</span>
                <span className="detail-value">{mockOrderDetails.estimatedDelivery}</span>
              </div>
            </div>
          </div>
          
          <div className="order-details-section">
            <h2>Información del Cliente</h2>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Nombre</span>
                <span className="detail-value">{mockOrderDetails.customer.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Teléfono</span>
                <span className="detail-value">{mockOrderDetails.customer.phone}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-value">{mockOrderDetails.customer.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Dirección</span>
                <span className="detail-value">
                  {mockOrderDetails.address.street}, {mockOrderDetails.address.city}, {mockOrderDetails.address.state} {mockOrderDetails.address.zipCode}
                </span>
              </div>
            </div>
          </div>
          
          <div className="order-details-section">
            <h2>Información de Entrega</h2>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Asignado a</span>
                <span className="detail-value">{mockOrderDetails.assignedTo}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Vehículo</span>
                <span className="detail-value">{mockOrderDetails.vehicle}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Instrucciones Especiales</span>
                <span className="detail-value">{mockOrderDetails.specialInstructions}</span>
              </div>
            </div>
          </div>
          
          <div className="order-details-section">
            <h2>Items del Pedido</h2>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Descripción</th>
                  <th>Cantidad</th>
                  <th>Peso</th>
                  <th>Dimensiones</th>
                  <th>Frágil</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                {mockOrderDetails.items.map(item => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{item.weight}</td>
                    <td>{item.dimensions}</td>
                    <td>{item.fragile ? 'Sí' : 'No'}</td>
                    <td>{item.price}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total</td>
                  <td style={{ fontWeight: 'bold' }}>{mockOrderDetails.total}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div className="order-details-section">
            <h2>Historial del Pedido</h2>
            <div className="order-history">
              {mockOrderDetails.history.map((event, index) => (
                <div key={index} className="history-item">
                  <div className="history-dot"></div>
                  <div className="history-content">
                    <div className="history-time">{event.timestamp}</div>
                    <div className="history-status">
                      <span className={`status-badge ${event.status}`}>
                        {getStatusLabel(event.status)}
                      </span>
                    </div>
                    <div className="history-description">{event.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  };
  
  return (
    <div className="orders-container">
      {selectedOrder ? renderOrderDetails() : renderOrderList()}
    </div>
  );
};

export default Orders;
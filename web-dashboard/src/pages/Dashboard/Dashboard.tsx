import React from 'react';
import { Package, Truck, Navigation, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import StatsCard from '../../components/StatsCard/StatsCard';
import RecentActivity from '../../components/RecentActivity/RecentActivity';
import LiveMap from '../../components/LiveMap/LiveMap';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    // Mock data - in real app this would come from API
    const stats = [
        {
            title: 'Pedidos Activos',
            value: '24',
            change: '+12%',
            changeType: 'positive' as const,
            icon: Package,
            color: '#3b82f6'
        },
        {
            title: 'Vehículos en Ruta',
            value: '8',
            change: '+2',
            changeType: 'positive' as const,
            icon: Truck,
            color: '#10b981'
        },
        {
            title: 'Rutas Completadas',
            value: '156',
            change: '+8%',
            changeType: 'positive' as const,
            icon: Navigation,
            color: '#8b5cf6'
        },
        {
            title: 'Tiempo Promedio',
            value: '45min',
            change: '-5min',
            changeType: 'positive' as const,
            icon: Clock,
            color: '#f59e0b'
        }
    ];

    const recentActivities = [
        {
            id: '1',
            type: 'order_created',
            message: 'Nuevo pedido #ORD-001 creado',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            status: 'info' as const
        },
        {
            id: '2',
            type: 'vehicle_dispatched',
            message: 'Vehículo VH-001 despachado con 5 pedidos',
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
            status: 'success' as const
        },
        {
            id: '3',
            type: 'delivery_completed',
            message: 'Entrega completada para pedido #ORD-045',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            status: 'success' as const
        },
        {
            id: '4',
            type: 'route_optimized',
            message: 'Ruta RT-003 optimizada - ahorro de 15 minutos',
            timestamp: new Date(Date.now() - 45 * 60 * 1000),
            status: 'info' as const
        },
        {
            id: '5',
            type: 'delivery_failed',
            message: 'Entrega fallida para pedido #ORD-032 - cliente ausente',
            timestamp: new Date(Date.now() - 60 * 60 * 1000),
            status: 'warning' as const
        }
    ];

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Dashboard de Monitoreo</h1>
                <p>Vista general del sistema de entregas en tiempo real</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <StatsCard key={index} {...stat} />
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-grid">
                {/* Live Map */}
                <div className="dashboard-card map-card">
                    <div className="card-header">
                        <h3>Mapa en Tiempo Real</h3>
                        <div className="live-indicator">
                            <div className="live-dot"></div>
                            <span>En vivo</span>
                        </div>
                    </div>
                    <LiveMap />
                </div>

                {/* Recent Activity */}
                <div className="dashboard-card activity-card">
                    <div className="card-header">
                        <h3>Actividad Reciente</h3>
                    </div>
                    <RecentActivity activities={recentActivities} />
                </div>

                {/* Performance Metrics */}
                <div className="dashboard-card metrics-card">
                    <div className="card-header">
                        <h3>Métricas de Rendimiento</h3>
                    </div>
                    <div className="metrics-content">
                        <div className="metric-item">
                            <div className="metric-icon success">
                                <TrendingUp size={20} />
                            </div>
                            <div className="metric-info">
                                <span className="metric-label">Tasa de Entrega</span>
                                <span className="metric-value">94.2%</span>
                            </div>
                        </div>
                        <div className="metric-item">
                            <div className="metric-icon warning">
                                <Clock size={20} />
                            </div>
                            <div className="metric-info">
                                <span className="metric-label">Tiempo Promedio</span>
                                <span className="metric-value">42 min</span>
                            </div>
                        </div>
                        <div className="metric-item">
                            <div className="metric-icon danger">
                                <AlertTriangle size={20} />
                            </div>
                            <div className="metric-info">
                                <span className="metric-label">Entregas Fallidas</span>
                                <span className="metric-value">3</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="dashboard-card actions-card">
                    <div className="card-header">
                        <h3>Acciones Rápidas</h3>
                    </div>
                    <div className="quick-actions">
                        <button className="action-btn primary">
                            <Package size={16} />
                            Crear Pedido
                        </button>
                        <button className="action-btn secondary">
                            <Truck size={16} />
                            Asignar Vehículo
                        </button>
                        <button className="action-btn secondary">
                            <Navigation size={16} />
                            Planificar Ruta
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
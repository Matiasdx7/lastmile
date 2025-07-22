"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BpmService = void 0;
const BpmModel_1 = require("../models/BpmModel");
const OrderStatus_1 = require("../../../shared/types/enums/OrderStatus");
const OrderRepository_1 = require("../../../shared/database/repositories/OrderRepository");
const DispatchRepository_1 = require("../../../shared/database/repositories/DispatchRepository");
const LoadRepository_1 = require("../../../shared/database/repositories/LoadRepository");
const RouteRepository_1 = require("../../../shared/database/repositories/RouteRepository");
const VehicleRepository_1 = require("../../../shared/database/repositories/VehicleRepository");
const dbConnection_1 = __importDefault(require("../utils/dbConnection"));
class BpmService {
    constructor() {
        this.orderRepository = new OrderRepository_1.OrderRepository(dbConnection_1.default);
        this.dispatchRepository = new DispatchRepository_1.DispatchRepository(dbConnection_1.default);
        this.loadRepository = new LoadRepository_1.LoadRepository(dbConnection_1.default);
        this.routeRepository = new RouteRepository_1.RouteRepository(dbConnection_1.default);
        this.vehicleRepository = new VehicleRepository_1.VehicleRepository(dbConnection_1.default);
    }
    async generateProcessDiagram() {
        try {
            const diagram = JSON.parse(JSON.stringify(BpmModel_1.mainProcessFlow));
            const counts = await this.getProcessStageCounts();
            const metrics = await this.getProcessMetrics();
            for (const node of diagram.nodes) {
                if (counts[node.id]) {
                    node.count = counts[node.id];
                }
                if (metrics[node.id]) {
                    node.metrics = metrics[node.id];
                }
            }
            return diagram;
        }
        catch (error) {
            console.error('Error generating process diagram:', error);
            throw new Error('Failed to generate process diagram');
        }
    }
    async generateOrderProcessDiagram(orderId) {
        try {
            const diagram = JSON.parse(JSON.stringify(BpmModel_1.orderStateFlow));
            const orderState = await this.getOrderProcessState(orderId);
            if (!orderState) {
                throw new Error(`Order ${orderId} not found`);
            }
            for (const node of diagram.nodes) {
                if (node.id === orderState.currentStage) {
                    node.status = 'active';
                }
                else if (orderState.history.some(h => h.stage === node.id && h.completedAt)) {
                    node.status = 'completed';
                }
                else if (orderState.history.some(h => h.stage === node.id)) {
                    node.status = 'in-progress';
                }
            }
            return diagram;
        }
        catch (error) {
            console.error(`Error generating process diagram for order ${orderId}:`, error);
            throw new Error(`Order ${orderId} not found`);
        }
    }
    async getProcessNodeDetails(nodeId) {
        try {
            const node = BpmModel_1.mainProcessFlow.nodes.find(n => n.id === nodeId);
            if (!node) {
                throw new Error(`Process node ${nodeId} not found`);
            }
            const metrics = await this.getProcessMetrics();
            const nodeMetrics = metrics[nodeId] || {
                averageTime: 0,
                count: 0,
                errorRate: 0,
                bottleneck: false
            };
            const recentOrders = await this.getRecentOrdersInStage(nodeId, 5);
            return {
                id: node.id,
                name: node.name,
                type: node.type,
                parent: node.parent,
                metrics: nodeMetrics,
                recentOrders
            };
        }
        catch (error) {
            console.error(`Error getting details for process node ${nodeId}:`, error);
            throw new Error(`Process node ${nodeId} not found`);
        }
    }
    async getProcessStageCounts() {
        try {
            const counts = {};
            const orderStatusCounts = {};
            for (const status of Object.values(OrderStatus_1.OrderStatus)) {
                try {
                    const result = await this.orderRepository.findByStatus(status);
                    orderStatusCounts[status] = result.items.length;
                }
                catch (error) {
                    console.error(`Error getting count for status ${status}:`, error);
                    orderStatusCounts[status] = 0;
                }
            }
            for (const [stage, statuses] of Object.entries(BpmModel_1.processStageMap)) {
                counts[stage] = statuses.reduce((sum, status) => {
                    return sum + (orderStatusCounts[status] || 0);
                }, 0);
            }
            for (const node of BpmModel_1.mainProcessFlow.nodes) {
                if (node.type === 'sub' && node.parent && counts[node.parent]) {
                    counts[node.id] = counts[node.parent];
                }
            }
            return counts;
        }
        catch (error) {
            console.error('Error getting process stage counts:', error);
            return {};
        }
    }
    async getProcessMetrics() {
        try {
            const metrics = {};
            metrics['order-reception'] = {
                averageTime: 5,
                count: 120,
                errorRate: 2.5,
                bottleneck: false
            };
            metrics['load-consolidation'] = {
                averageTime: 15,
                count: 95,
                errorRate: 5.0,
                bottleneck: false
            };
            metrics['vehicle-assignment'] = {
                averageTime: 25,
                count: 80,
                errorRate: 8.0,
                bottleneck: true
            };
            metrics['route-planning'] = {
                averageTime: 12,
                count: 75,
                errorRate: 3.0,
                bottleneck: false
            };
            metrics['dispatch'] = {
                averageTime: 8,
                count: 70,
                errorRate: 1.5,
                bottleneck: false
            };
            metrics['delivery'] = {
                averageTime: 45,
                count: 65,
                errorRate: 10.0,
                bottleneck: false
            };
            for (const node of BpmModel_1.mainProcessFlow.nodes) {
                if (node.type === 'sub' && node.parent && metrics[node.parent]) {
                    metrics[node.id] = {
                        ...metrics[node.parent],
                        averageTime: metrics[node.parent].averageTime / 2
                    };
                }
            }
            return metrics;
        }
        catch (error) {
            console.error('Error getting process metrics:', error);
            return {};
        }
    }
    async getOrderProcessState(orderId) {
        try {
            const order = await this.orderRepository.findById(orderId);
            if (!order) {
                return null;
            }
            let currentStage = '';
            for (const [stage, statuses] of Object.entries(BpmModel_1.processStageMap)) {
                if (statuses.includes(order.status)) {
                    currentStage = stage;
                    break;
                }
            }
            const history = this.simulateOrderHistory(order.status, order.createdAt);
            return {
                orderId,
                currentStage,
                history
            };
        }
        catch (error) {
            console.error(`Error getting process state for order ${orderId}:`, error);
            return null;
        }
    }
    simulateOrderHistory(status, createdAt) {
        const history = [];
        const now = new Date();
        const addMinutes = (date, minutes) => {
            return new Date(date.getTime() + minutes * 60000);
        };
        switch (status) {
            case OrderStatus_1.OrderStatus.PENDING:
                history.push({
                    stage: 'order-reception',
                    enteredAt: createdAt,
                    completedAt: undefined
                });
                break;
            case OrderStatus_1.OrderStatus.CONSOLIDATED:
                history.push({
                    stage: 'order-reception',
                    enteredAt: createdAt,
                    completedAt: addMinutes(createdAt, 5),
                    duration: 5
                });
                history.push({
                    stage: 'load-consolidation',
                    enteredAt: addMinutes(createdAt, 5),
                    completedAt: undefined
                });
                break;
            case OrderStatus_1.OrderStatus.ASSIGNED:
                history.push({
                    stage: 'order-reception',
                    enteredAt: createdAt,
                    completedAt: addMinutes(createdAt, 5),
                    duration: 5
                });
                history.push({
                    stage: 'load-consolidation',
                    enteredAt: addMinutes(createdAt, 5),
                    completedAt: addMinutes(createdAt, 20),
                    duration: 15
                });
                history.push({
                    stage: 'vehicle-assignment',
                    enteredAt: addMinutes(createdAt, 20),
                    completedAt: undefined
                });
                break;
            case OrderStatus_1.OrderStatus.ROUTED:
                history.push({
                    stage: 'order-reception',
                    enteredAt: createdAt,
                    completedAt: addMinutes(createdAt, 5),
                    duration: 5
                });
                history.push({
                    stage: 'load-consolidation',
                    enteredAt: addMinutes(createdAt, 5),
                    completedAt: addMinutes(createdAt, 20),
                    duration: 15
                });
                history.push({
                    stage: 'vehicle-assignment',
                    enteredAt: addMinutes(createdAt, 20),
                    completedAt: addMinutes(createdAt, 45),
                    duration: 25
                });
                history.push({
                    stage: 'route-planning',
                    enteredAt: addMinutes(createdAt, 45),
                    completedAt: undefined
                });
                break;
            case OrderStatus_1.OrderStatus.DISPATCHED:
                history.push({
                    stage: 'order-reception',
                    enteredAt: createdAt,
                    completedAt: addMinutes(createdAt, 5),
                    duration: 5
                });
                history.push({
                    stage: 'load-consolidation',
                    enteredAt: addMinutes(createdAt, 5),
                    completedAt: addMinutes(createdAt, 20),
                    duration: 15
                });
                history.push({
                    stage: 'vehicle-assignment',
                    enteredAt: addMinutes(createdAt, 20),
                    completedAt: addMinutes(createdAt, 45),
                    duration: 25
                });
                history.push({
                    stage: 'route-planning',
                    enteredAt: addMinutes(createdAt, 45),
                    completedAt: addMinutes(createdAt, 57),
                    duration: 12
                });
                history.push({
                    stage: 'dispatch',
                    enteredAt: addMinutes(createdAt, 57),
                    completedAt: undefined
                });
                break;
            case OrderStatus_1.OrderStatus.IN_TRANSIT:
            case OrderStatus_1.OrderStatus.DELIVERED:
            case OrderStatus_1.OrderStatus.FAILED:
                history.push({
                    stage: 'order-reception',
                    enteredAt: createdAt,
                    completedAt: addMinutes(createdAt, 5),
                    duration: 5
                });
                history.push({
                    stage: 'load-consolidation',
                    enteredAt: addMinutes(createdAt, 5),
                    completedAt: addMinutes(createdAt, 20),
                    duration: 15
                });
                history.push({
                    stage: 'vehicle-assignment',
                    enteredAt: addMinutes(createdAt, 20),
                    completedAt: addMinutes(createdAt, 45),
                    duration: 25
                });
                history.push({
                    stage: 'route-planning',
                    enteredAt: addMinutes(createdAt, 45),
                    completedAt: addMinutes(createdAt, 57),
                    duration: 12
                });
                history.push({
                    stage: 'dispatch',
                    enteredAt: addMinutes(createdAt, 57),
                    completedAt: addMinutes(createdAt, 65),
                    duration: 8
                });
                const deliveryEntry = {
                    stage: 'delivery',
                    enteredAt: addMinutes(createdAt, 65)
                };
                if (status === OrderStatus_1.OrderStatus.DELIVERED || status === OrderStatus_1.OrderStatus.FAILED) {
                    Object.assign(deliveryEntry, {
                        completedAt: now,
                        duration: Math.round((now.getTime() - addMinutes(createdAt, 65).getTime()) / 60000)
                    });
                }
                history.push(deliveryEntry);
                break;
            default:
                history.push({
                    stage: 'order-reception',
                    enteredAt: createdAt,
                    completedAt: undefined
                });
        }
        return history;
    }
    async getRecentOrdersInStage(stageId, limit) {
        try {
            const stageStatuses = BpmModel_1.processStageMap[stageId];
            if (!stageStatuses || stageStatuses.length === 0) {
                return [];
            }
            let allOrders = [];
            for (const status of stageStatuses) {
                try {
                    const result = await this.orderRepository.findByStatus(status);
                    allOrders = [...allOrders, ...result.items];
                }
                catch (error) {
                    console.error(`Error getting orders for status ${status}:`, error);
                }
            }
            allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            allOrders = allOrders.slice(0, limit);
            return allOrders.map(order => ({
                id: order.id,
                customerName: order.customerName,
                status: order.status,
                createdAt: order.createdAt
            }));
        }
        catch (error) {
            console.error(`Error getting recent orders for stage ${stageId}:`, error);
            return [];
        }
    }
    async detectBottlenecks() {
        try {
            const metrics = await this.getProcessMetrics();
            const bottlenecks = [];
            for (const [nodeId, nodeMetrics] of Object.entries(metrics)) {
                if (nodeMetrics.bottleneck) {
                    bottlenecks.push(nodeId);
                }
            }
            return bottlenecks;
        }
        catch (error) {
            console.error('Error detecting bottlenecks:', error);
            return [];
        }
    }
    async getSystemMetrics() {
        try {
            const metrics = await this.getProcessMetrics();
            let totalTime = 0;
            let totalCount = 0;
            let totalErrors = 0;
            const mainStages = ['order-reception', 'load-consolidation', 'vehicle-assignment',
                'route-planning', 'dispatch', 'delivery'];
            for (const stage of mainStages) {
                if (metrics[stage]) {
                    totalTime += metrics[stage].averageTime;
                    totalCount += metrics[stage].count;
                    totalErrors += metrics[stage].count * (metrics[stage].errorRate / 100);
                }
            }
            const bottlenecks = await this.detectBottlenecks();
            return {
                averageTotalProcessingTime: totalTime,
                totalOrdersInSystem: totalCount,
                overallErrorRate: totalCount > 0 ? (totalErrors / totalCount) * 100 : 0,
                bottlenecks: bottlenecks.map(id => {
                    const node = BpmModel_1.mainProcessFlow.nodes.find(n => n.id === id);
                    return node ? node.name : id;
                }),
                stageMetrics: mainStages.map(stage => ({
                    name: BpmModel_1.mainProcessFlow.nodes.find(n => n.id === stage)?.name || stage,
                    metrics: metrics[stage] || { averageTime: 0, count: 0, errorRate: 0, bottleneck: false }
                }))
            };
        }
        catch (error) {
            console.error('Error getting system metrics:', error);
            throw new Error('Failed to get system metrics');
        }
    }
}
exports.BpmService = BpmService;
//# sourceMappingURL=BpmService.js.map
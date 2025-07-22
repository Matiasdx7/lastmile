"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const OrderRepository_1 = require("../../../shared/database/repositories/OrderRepository");
const DispatchRepository_1 = require("../../../shared/database/repositories/DispatchRepository");
const LoadRepository_1 = require("../../../shared/database/repositories/LoadRepository");
const RouteRepository_1 = require("../../../shared/database/repositories/RouteRepository");
const VehicleRepository_1 = require("../../../shared/database/repositories/VehicleRepository");
const OrderStatus_1 = require("../../../shared/types/enums/OrderStatus");
const dbConnection_1 = __importDefault(require("../utils/dbConnection"));
class MetricsService {
    constructor() {
        this.orderRepository = new OrderRepository_1.OrderRepository(dbConnection_1.default);
        this.dispatchRepository = new DispatchRepository_1.DispatchRepository(dbConnection_1.default);
        this.loadRepository = new LoadRepository_1.LoadRepository(dbConnection_1.default);
        this.routeRepository = new RouteRepository_1.RouteRepository(dbConnection_1.default);
        this.vehicleRepository = new VehicleRepository_1.VehicleRepository(dbConnection_1.default);
    }
    async getStageMetrics(timeRange) {
        try {
            const stages = [
                { id: 'order-reception', name: 'Order Reception' },
                { id: 'load-consolidation', name: 'Load Consolidation' },
                { id: 'vehicle-assignment', name: 'Vehicle Assignment' },
                { id: 'route-planning', name: 'Route Planning' },
                { id: 'dispatch', name: 'Dispatch' },
                { id: 'delivery', name: 'Delivery to Customer' }
            ];
            const metrics = stages.map(stage => {
                let averageTime = 0;
                let count = 0;
                let errorRate = 0;
                let bottleneck = false;
                let trend = 'stable';
                switch (stage.id) {
                    case 'order-reception':
                        averageTime = 5;
                        count = 120;
                        errorRate = 2.5;
                        trend = 'improving';
                        break;
                    case 'load-consolidation':
                        averageTime = 15;
                        count = 95;
                        errorRate = 5.0;
                        trend = 'stable';
                        break;
                    case 'vehicle-assignment':
                        averageTime = 25;
                        count = 80;
                        errorRate = 8.0;
                        bottleneck = true;
                        trend = 'worsening';
                        break;
                    case 'route-planning':
                        averageTime = 12;
                        count = 75;
                        errorRate = 3.0;
                        trend = 'stable';
                        break;
                    case 'dispatch':
                        averageTime = 8;
                        count = 70;
                        errorRate = 1.5;
                        trend = 'improving';
                        break;
                    case 'delivery':
                        averageTime = 45;
                        count = 65;
                        errorRate = 10.0;
                        trend = 'stable';
                        break;
                }
                return {
                    stageId: stage.id,
                    stageName: stage.name,
                    averageTime,
                    count,
                    errorRate,
                    bottleneck,
                    trend
                };
            });
            return metrics;
        }
        catch (error) {
            console.error('Error getting stage metrics:', error);
            throw new Error('Failed to get stage metrics');
        }
    }
    async getSystemMetrics(timeRange) {
        try {
            const now = new Date();
            const start = timeRange?.start || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const end = timeRange?.end || now;
            const stageMetrics = await this.getStageMetrics(timeRange);
            let totalOrdersProcessed = 0;
            let totalOrdersInProgress = 0;
            let totalTime = 0;
            let totalErrors = 0;
            const bottlenecks = [];
            for (const metrics of stageMetrics) {
                totalTime += metrics.averageTime;
                totalOrdersProcessed += metrics.count;
                totalErrors += metrics.count * (metrics.errorRate / 100);
                if (metrics.bottleneck) {
                    bottlenecks.push(metrics.stageId);
                }
            }
            totalOrdersInProgress = 0;
            const inProgressStatuses = [
                OrderStatus_1.OrderStatus.PENDING,
                OrderStatus_1.OrderStatus.CONSOLIDATED,
                OrderStatus_1.OrderStatus.ASSIGNED,
                OrderStatus_1.OrderStatus.ROUTED,
                OrderStatus_1.OrderStatus.DISPATCHED,
                OrderStatus_1.OrderStatus.IN_TRANSIT
            ];
            for (const status of inProgressStatuses) {
                try {
                    const result = await this.orderRepository.findByStatus(status);
                    totalOrdersInProgress += result.items.length;
                }
                catch (error) {
                    console.error(`Error getting count for status ${status}:`, error);
                }
            }
            return {
                totalOrdersProcessed,
                totalOrdersInProgress,
                averageTotalProcessingTime: totalTime,
                overallErrorRate: totalOrdersProcessed > 0 ? (totalErrors / totalOrdersProcessed) * 100 : 0,
                bottlenecks,
                stageMetrics,
                timeRangeStart: start,
                timeRangeEnd: end
            };
        }
        catch (error) {
            console.error('Error getting system metrics:', error);
            throw new Error('Failed to get system metrics');
        }
    }
    async detectBottlenecks() {
        try {
            const stageMetrics = await this.getStageMetrics();
            const bottlenecks = [];
            for (const metrics of stageMetrics) {
                if (metrics.bottleneck) {
                    let severity;
                    let recommendation;
                    if (metrics.averageTime > 30 && metrics.errorRate > 5) {
                        severity = 'high';
                    }
                    else if (metrics.averageTime > 15 || metrics.errorRate > 3) {
                        severity = 'medium';
                    }
                    else {
                        severity = 'low';
                    }
                    switch (metrics.stageId) {
                        case 'vehicle-assignment':
                            recommendation = severity === 'high'
                                ? 'Consider adding more vehicles to the fleet or optimizing vehicle allocation algorithm'
                                : 'Review vehicle assignment criteria and optimize for faster processing';
                            break;
                        case 'load-consolidation':
                            recommendation = 'Optimize load consolidation algorithm to reduce processing time';
                            break;
                        case 'route-planning':
                            recommendation = 'Improve route optimization algorithm or add more computing resources';
                            break;
                        default:
                            recommendation = 'Review process flow and identify optimization opportunities';
                    }
                    bottlenecks.push({
                        stageId: metrics.stageId,
                        stageName: metrics.stageName,
                        severity,
                        averageTime: metrics.averageTime,
                        count: metrics.count,
                        recommendation
                    });
                }
            }
            return bottlenecks;
        }
        catch (error) {
            console.error('Error detecting bottlenecks:', error);
            throw new Error('Failed to detect bottlenecks');
        }
    }
    async getPerformanceIndicators() {
        try {
            const stageMetrics = await this.getStageMetrics();
            const systemMetrics = await this.getSystemMetrics();
            const indicators = stageMetrics.map(metrics => {
                const efficiency = metrics.averageTime > 0 ? 100 / metrics.averageTime : 100;
                const quality = 100 - metrics.errorRate;
                const throughput = metrics.count / (24 * 7);
                const score = (efficiency * 0.4) + (quality * 0.4) + (Math.min(throughput, 10) * 2);
                return {
                    stageId: metrics.stageId,
                    stageName: metrics.stageName,
                    efficiency: Math.round(efficiency * 100) / 100,
                    quality: Math.round(quality * 100) / 100,
                    throughput: Math.round(throughput * 100) / 100,
                    score: Math.round(score),
                    trend: metrics.trend
                };
            });
            const systemEfficiency = systemMetrics.averageTotalProcessingTime > 0
                ? 100 / systemMetrics.averageTotalProcessingTime
                : 100;
            const systemQuality = 100 - systemMetrics.overallErrorRate;
            const systemThroughput = systemMetrics.totalOrdersProcessed / (24 * 7);
            const systemScore = (systemEfficiency * 0.4) + (systemQuality * 0.4) + (Math.min(systemThroughput, 10) * 2);
            return {
                stageIndicators: indicators,
                systemIndicators: {
                    efficiency: Math.round(systemEfficiency * 100) / 100,
                    quality: Math.round(systemQuality * 100) / 100,
                    throughput: Math.round(systemThroughput * 100) / 100,
                    score: Math.round(systemScore)
                }
            };
        }
        catch (error) {
            console.error('Error getting performance indicators:', error);
            throw new Error('Failed to get performance indicators');
        }
    }
    async getHistoricalMetrics(days = 30) {
        try {
            const now = new Date();
            const results = [];
            for (let i = 0; i < days; i++) {
                const date = new Date(now.getTime() - (days - i - 1) * 24 * 60 * 60 * 1000);
                const baseMetrics = {
                    orderReceptionTime: 5 + Math.random() * 2 - 1,
                    loadConsolidationTime: 15 + Math.random() * 4 - 2,
                    vehicleAssignmentTime: 25 + Math.random() * 6 - 3,
                    routePlanningTime: 12 + Math.random() * 3 - 1.5,
                    dispatchTime: 8 + Math.random() * 2 - 1,
                    deliveryTime: 45 + Math.random() * 10 - 5,
                    totalOrders: Math.floor(80 + Math.random() * 40 - 20),
                    errorRate: 5 + Math.random() * 2 - 1
                };
                results.push({
                    date: date.toISOString().split('T')[0],
                    ...baseMetrics
                });
            }
            return results;
        }
        catch (error) {
            console.error('Error getting historical metrics:', error);
            throw new Error('Failed to get historical metrics');
        }
    }
}
exports.MetricsService = MetricsService;
//# sourceMappingURL=MetricsService.js.map
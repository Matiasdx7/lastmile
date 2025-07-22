import { OrderRepository } from '../../../shared/database/repositories/OrderRepository';
import { DispatchRepository } from '../../../shared/database/repositories/DispatchRepository';
import { LoadRepository } from '../../../shared/database/repositories/LoadRepository';
import { RouteRepository } from '../../../shared/database/repositories/RouteRepository';
import { VehicleRepository } from '../../../shared/database/repositories/VehicleRepository';
import { OrderStatus } from '../../../shared/types/enums/OrderStatus';
import dbPool from '../utils/dbConnection';

export interface StageMetrics {
  stageName: string;
  stageId: string;
  averageTime: number; // in minutes
  count: number;
  errorRate: number; // percentage
  bottleneck: boolean;
  trend: 'improving' | 'stable' | 'worsening';
}

export interface SystemMetrics {
  totalOrdersProcessed: number;
  totalOrdersInProgress: number;
  averageTotalProcessingTime: number; // in minutes
  overallErrorRate: number; // percentage
  bottlenecks: string[];
  stageMetrics: StageMetrics[];
  timeRangeStart: Date;
  timeRangeEnd: Date;
}

export interface BottleneckInfo {
  stageId: string;
  stageName: string;
  severity: 'low' | 'medium' | 'high';
  averageTime: number;
  count: number;
  recommendation: string;
}

export class MetricsService {
  private orderRepository: OrderRepository;
  private dispatchRepository: DispatchRepository;
  private loadRepository: LoadRepository;
  private routeRepository: RouteRepository;
  private vehicleRepository: VehicleRepository;

  constructor() {
    this.orderRepository = new OrderRepository(dbPool);
    this.dispatchRepository = new DispatchRepository(dbPool);
    this.loadRepository = new LoadRepository(dbPool);
    this.routeRepository = new RouteRepository(dbPool);
    this.vehicleRepository = new VehicleRepository(dbPool);
  }

  /**
   * Get metrics for all process stages
   */
  async getStageMetrics(timeRange?: { start: Date; end: Date }): Promise<StageMetrics[]> {
    try {
      // In a real system, these metrics would be calculated from actual order processing times
      // For this prototype, we'll use simulated metrics

      // Define the main process stages
      const stages = [
        { id: 'order-reception', name: 'Order Reception' },
        { id: 'load-consolidation', name: 'Load Consolidation' },
        { id: 'vehicle-assignment', name: 'Vehicle Assignment' },
        { id: 'route-planning', name: 'Route Planning' },
        { id: 'dispatch', name: 'Dispatch' },
        { id: 'delivery', name: 'Delivery to Customer' }
      ];

      // Generate metrics for each stage
      const metrics: StageMetrics[] = stages.map(stage => {
        // Simulate different metrics for each stage
        let averageTime = 0;
        let count = 0;
        let errorRate = 0;
        let bottleneck = false;
        let trend: 'improving' | 'stable' | 'worsening' = 'stable';

        switch (stage.id) {
          case 'order-reception':
            averageTime = 5; // 5 minutes
            count = 120;
            errorRate = 2.5; // 2.5%
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
            bottleneck = true; // This stage is a bottleneck
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
    } catch (error) {
      console.error('Error getting stage metrics:', error);
      throw new Error('Failed to get stage metrics');
    }
  }

  /**
   * Get system-wide metrics
   */
  async getSystemMetrics(timeRange?: { start: Date; end: Date }): Promise<SystemMetrics> {
    try {
      const now = new Date();
      const start = timeRange?.start || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Default to 7 days ago
      const end = timeRange?.end || now;

      // Get stage metrics
      const stageMetrics = await this.getStageMetrics(timeRange);

      // Calculate system-wide metrics
      let totalOrdersProcessed = 0;
      let totalOrdersInProgress = 0;
      let totalTime = 0;
      let totalErrors = 0;
      const bottlenecks: string[] = [];

      for (const metrics of stageMetrics) {
        totalTime += metrics.averageTime;
        totalOrdersProcessed += metrics.count;
        totalErrors += metrics.count * (metrics.errorRate / 100);

        if (metrics.bottleneck) {
          bottlenecks.push(metrics.stageId);
        }
      }

      // Get count of orders in progress
      // Since countByStatuses doesn't exist, we'll count each status individually
      totalOrdersInProgress = 0;
      const inProgressStatuses = [
        OrderStatus.PENDING,
        OrderStatus.CONSOLIDATED,
        OrderStatus.ASSIGNED,
        OrderStatus.ROUTED,
        OrderStatus.DISPATCHED,
        OrderStatus.IN_TRANSIT
      ];

      for (const status of inProgressStatuses) {
        try {
          const result = await this.orderRepository.findByStatus(status);
          totalOrdersInProgress += result.items.length;
        } catch (error) {
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
    } catch (error) {
      console.error('Error getting system metrics:', error);
      throw new Error('Failed to get system metrics');
    }
  }

  /**
   * Detect bottlenecks in the process flow
   */
  async detectBottlenecks(): Promise<BottleneckInfo[]> {
    try {
      const stageMetrics = await this.getStageMetrics();
      const bottlenecks: BottleneckInfo[] = [];

      for (const metrics of stageMetrics) {
        if (metrics.bottleneck) {
          let severity: 'low' | 'medium' | 'high';
          let recommendation: string;

          // Determine severity based on metrics
          if (metrics.averageTime > 30 && metrics.errorRate > 5) {
            severity = 'high';
          } else if (metrics.averageTime > 15 || metrics.errorRate > 3) {
            severity = 'medium';
          } else {
            severity = 'low';
          }

          // Generate recommendation based on stage and severity
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
    } catch (error) {
      console.error('Error detecting bottlenecks:', error);
      throw new Error('Failed to detect bottlenecks');
    }
  }

  /**
   * Get performance indicators for each process stage
   */
  async getPerformanceIndicators(): Promise<any> {
    try {
      const stageMetrics = await this.getStageMetrics();
      const systemMetrics = await this.getSystemMetrics();

      // Calculate KPIs for each stage
      const indicators = stageMetrics.map(metrics => {
        // Calculate efficiency (lower is better)
        const efficiency = metrics.averageTime > 0 ? 100 / metrics.averageTime : 100;

        // Calculate quality (higher is better)
        const quality = 100 - metrics.errorRate;

        // Calculate throughput (orders per hour)
        const throughput = metrics.count / (24 * 7); // Assuming data is for 1 week

        // Calculate overall score (0-100)
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

      // Calculate system-wide indicators
      const systemEfficiency = systemMetrics.averageTotalProcessingTime > 0
        ? 100 / systemMetrics.averageTotalProcessingTime
        : 100;

      const systemQuality = 100 - systemMetrics.overallErrorRate;

      const systemThroughput = systemMetrics.totalOrdersProcessed / (24 * 7); // Assuming data is for 1 week

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
    } catch (error) {
      console.error('Error getting performance indicators:', error);
      throw new Error('Failed to get performance indicators');
    }
  }

  /**
   * Get historical metrics for trend analysis
   */
  async getHistoricalMetrics(days: number = 30): Promise<any> {
    try {
      const now = new Date();
      const results = [];

      // Generate daily metrics for the specified number of days
      for (let i = 0; i < days; i++) {
        const date = new Date(now.getTime() - (days - i - 1) * 24 * 60 * 60 * 1000);

        // Simulate metrics with some random variation
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
    } catch (error) {
      console.error('Error getting historical metrics:', error);
      throw new Error('Failed to get historical metrics');
    }
  }
}
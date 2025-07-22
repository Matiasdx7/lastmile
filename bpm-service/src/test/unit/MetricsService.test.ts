import { MetricsService } from '../../services/MetricsService';
import { OrderRepository } from '../../../../shared/database/repositories/OrderRepository';
import { OrderStatus } from '../../../../shared/types/enums/OrderStatus';
import { Pool } from 'pg';

// Mock the repositories
jest.mock('../../../../shared/database/repositories/OrderRepository');
jest.mock('../../../../shared/database/repositories/DispatchRepository');
jest.mock('../../../../shared/database/repositories/LoadRepository');
jest.mock('../../../../shared/database/repositories/RouteRepository');
jest.mock('../../../../shared/database/repositories/VehicleRepository');

// Mock the database pool
const mockPool = {} as Pool;

describe('MetricsService', () => {
  let metricsService: MetricsService;
  let mockOrderRepository: jest.Mocked<OrderRepository>;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup mock implementations
    mockOrderRepository = new OrderRepository(mockPool) as jest.Mocked<OrderRepository>;
    mockOrderRepository.findByStatus = jest.fn().mockImplementation((status: OrderStatus) => {
      // Return 6 orders for each status to make a total of 36 orders in progress
      const orders = Array(6).fill(null).map((_, i) => ({
        id: `order-${status}-${i}`,
        customerId: `customer-${i}`,
        customerName: `Customer ${i}`,
        status,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      return Promise.resolve(orders);
    });
    
    // Create the service with mocked repositories
    metricsService = new MetricsService();
    
    // Replace the repositories with mocks
    (metricsService as any).orderRepository = mockOrderRepository;
  });
  
  describe('getStageMetrics', () => {
    it('should return metrics for all process stages', async () => {
      const metrics = await metricsService.getStageMetrics();
      
      // Check that metrics are returned for all stages
      expect(metrics).toBeDefined();
      expect(metrics.length).toBe(6);
      
      // Check that each stage has the expected properties
      metrics.forEach(stageMetric => {
        expect(stageMetric.stageId).toBeDefined();
        expect(stageMetric.stageName).toBeDefined();
        expect(stageMetric.averageTime).toBeDefined();
        expect(stageMetric.count).toBeDefined();
        expect(stageMetric.errorRate).toBeDefined();
        expect(stageMetric.trend).toBeDefined();
      });
    });
    
    it('should accept a time range parameter', async () => {
      const timeRange = {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-07')
      };
      
      const metrics = await metricsService.getStageMetrics(timeRange);
      
      // Check that metrics are still returned
      expect(metrics).toBeDefined();
      expect(metrics.length).toBe(6);
    });
  });
  
  describe('getSystemMetrics', () => {
    it('should return system-wide metrics', async () => {
      const metrics = await metricsService.getSystemMetrics();
      
      // Check that the metrics have the expected structure
      expect(metrics).toBeDefined();
      expect(metrics.totalOrdersProcessed).toBeDefined();
      expect(metrics.totalOrdersInProgress).toBeDefined();
      expect(metrics.averageTotalProcessingTime).toBeDefined();
      expect(metrics.overallErrorRate).toBeDefined();
      expect(metrics.bottlenecks).toBeDefined();
      expect(metrics.stageMetrics).toBeDefined();
      expect(metrics.timeRangeStart).toBeDefined();
      expect(metrics.timeRangeEnd).toBeDefined();
      
      // Check that the repository was called to get orders in progress
      expect(mockOrderRepository.findByStatus).toHaveBeenCalledWith(OrderStatus.PENDING);
      expect(mockOrderRepository.findByStatus).toHaveBeenCalledWith(OrderStatus.CONSOLIDATED);
      expect(mockOrderRepository.findByStatus).toHaveBeenCalledWith(OrderStatus.ASSIGNED);
      expect(mockOrderRepository.findByStatus).toHaveBeenCalledWith(OrderStatus.ROUTED);
      expect(mockOrderRepository.findByStatus).toHaveBeenCalledWith(OrderStatus.DISPATCHED);
      expect(mockOrderRepository.findByStatus).toHaveBeenCalledWith(OrderStatus.IN_TRANSIT);
    });
    
    it('should accept a time range parameter', async () => {
      const timeRange = {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-07')
      };
      
      const metrics = await metricsService.getSystemMetrics(timeRange);
      
      // Check that metrics are still returned
      expect(metrics).toBeDefined();
      expect(metrics.timeRangeStart).toEqual(timeRange.start);
      expect(metrics.timeRangeEnd).toEqual(timeRange.end);
    });
  });
  
  describe('detectBottlenecks', () => {
    it('should return bottleneck information with recommendations', async () => {
      const bottlenecks = await metricsService.detectBottlenecks();
      
      // Check that bottlenecks are returned as an array
      expect(Array.isArray(bottlenecks)).toBe(true);
      
      // Check that each bottleneck has the expected properties
      bottlenecks.forEach(bottleneck => {
        expect(bottleneck.stageId).toBeDefined();
        expect(bottleneck.stageName).toBeDefined();
        expect(bottleneck.severity).toBeDefined();
        expect(bottleneck.averageTime).toBeDefined();
        expect(bottleneck.count).toBeDefined();
        expect(bottleneck.recommendation).toBeDefined();
      });
    });
  });
  
  describe('getPerformanceIndicators', () => {
    it('should return performance indicators for stages and system', async () => {
      const indicators = await metricsService.getPerformanceIndicators();
      
      // Check that indicators are returned for stages and system
      expect(indicators).toBeDefined();
      expect(indicators.stageIndicators).toBeDefined();
      expect(indicators.systemIndicators).toBeDefined();
      
      // Check that stage indicators have the expected properties
      indicators.stageIndicators.forEach((indicator: any) => {
        expect(indicator.stageId).toBeDefined();
        expect(indicator.stageName).toBeDefined();
        expect(indicator.efficiency).toBeDefined();
        expect(indicator.quality).toBeDefined();
        expect(indicator.throughput).toBeDefined();
        expect(indicator.score).toBeDefined();
        expect(indicator.trend).toBeDefined();
      });
      
      // Check that system indicators have the expected properties
      expect(indicators.systemIndicators.efficiency).toBeDefined();
      expect(indicators.systemIndicators.quality).toBeDefined();
      expect(indicators.systemIndicators.throughput).toBeDefined();
      expect(indicators.systemIndicators.score).toBeDefined();
    });
  });
  
  describe('getHistoricalMetrics', () => {
    it('should return historical metrics for the specified number of days', async () => {
      const days = 7;
      const metrics = await metricsService.getHistoricalMetrics(days);
      
      // Check that metrics are returned for the specified number of days
      expect(metrics).toBeDefined();
      expect(metrics.length).toBe(days);
      
      // Check that each day has the expected properties
      metrics.forEach((dayMetrics: any) => {
        expect(dayMetrics.date).toBeDefined();
        expect(dayMetrics.orderReceptionTime).toBeDefined();
        expect(dayMetrics.loadConsolidationTime).toBeDefined();
        expect(dayMetrics.vehicleAssignmentTime).toBeDefined();
        expect(dayMetrics.routePlanningTime).toBeDefined();
        expect(dayMetrics.dispatchTime).toBeDefined();
        expect(dayMetrics.deliveryTime).toBeDefined();
        expect(dayMetrics.totalOrders).toBeDefined();
        expect(dayMetrics.errorRate).toBeDefined();
      });
    });
    
    it('should default to 30 days if not specified', async () => {
      const metrics = await metricsService.getHistoricalMetrics();
      
      // Check that metrics are returned for 30 days
      expect(metrics).toBeDefined();
      expect(metrics.length).toBe(30);
    });
  });
});
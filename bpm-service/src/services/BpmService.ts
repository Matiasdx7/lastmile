import { 
  ProcessDiagram, 
  ProcessNode, 
  ProcessEdge, 
  ProcessMetrics,
  mainProcessFlow,
  orderStateFlow,
  processStageMap,
  OrderProcessState
} from '../models/BpmModel';
import { OrderStatus } from '../../../shared/types/enums/OrderStatus';
import { OrderRepository } from '../../../shared/database/repositories/OrderRepository';
import { DispatchRepository } from '../../../shared/database/repositories/DispatchRepository';
import { LoadRepository } from '../../../shared/database/repositories/LoadRepository';
import { RouteRepository } from '../../../shared/database/repositories/RouteRepository';
import { VehicleRepository } from '../../../shared/database/repositories/VehicleRepository';
import dbPool from '../utils/dbConnection';

export class BpmService {
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
   * Generate a process diagram with current status information
   */
  async generateProcessDiagram(): Promise<ProcessDiagram> {
    try {
      // Clone the main process flow to avoid modifying the original
      const diagram = JSON.parse(JSON.stringify(mainProcessFlow)) as ProcessDiagram;
      
      // Get counts for each process stage
      const counts = await this.getProcessStageCounts();
      
      // Get metrics for each process stage
      const metrics = await this.getProcessMetrics();
      
      // Update nodes with counts and metrics
      for (const node of diagram.nodes) {
        if (counts[node.id]) {
          node.count = counts[node.id];
        }
        
        if (metrics[node.id]) {
          node.metrics = metrics[node.id];
        }
      }
      
      return diagram;
    } catch (error) {
      console.error('Error generating process diagram:', error);
      throw new Error('Failed to generate process diagram');
    }
  }

  /**
   * Generate a process diagram for a specific order
   */
  async generateOrderProcessDiagram(orderId: string): Promise<ProcessDiagram> {
    try {
      // Clone the order state flow to avoid modifying the original
      const diagram = JSON.parse(JSON.stringify(orderStateFlow)) as ProcessDiagram;
      
      // Get the order's current state and history
      const orderState = await this.getOrderProcessState(orderId);
      
      if (!orderState) {
        throw new Error(`Order ${orderId} not found`);
      }
      
      // Highlight the current stage in the diagram
      for (const node of diagram.nodes) {
        if (node.id === orderState.currentStage) {
          node.status = 'active';
        } else if (orderState.history.some(h => h.stage === node.id && h.completedAt)) {
          node.status = 'completed';
        } else if (orderState.history.some(h => h.stage === node.id)) {
          node.status = 'in-progress';
        }
      }
      
      return diagram;
    } catch (error) {
      console.error(`Error generating process diagram for order ${orderId}:`, error);
      throw new Error(`Order ${orderId} not found`);
    }
  }

  /**
   * Get detailed information about a specific process node
   */
  async getProcessNodeDetails(nodeId: string): Promise<any> {
    try {
      // Find the node in the main process flow
      const node = mainProcessFlow.nodes.find(n => n.id === nodeId);
      
      if (!node) {
        throw new Error(`Process node ${nodeId} not found`);
      }
      
      // Get metrics for the node
      const metrics = await this.getProcessMetrics();
      const nodeMetrics = metrics[nodeId] || {
        averageTime: 0,
        count: 0,
        errorRate: 0,
        bottleneck: false
      };
      
      // Get recent orders in this stage
      const recentOrders = await this.getRecentOrdersInStage(nodeId, 5);
      
      return {
        id: node.id,
        name: node.name,
        type: node.type,
        parent: node.parent,
        metrics: nodeMetrics,
        recentOrders
      };
    } catch (error) {
      console.error(`Error getting details for process node ${nodeId}:`, error);
      throw new Error(`Process node ${nodeId} not found`);
    }
  }

  /**
   * Get counts of orders in each process stage
   */
  private async getProcessStageCounts(): Promise<Record<string, number>> {
    try {
      const counts: Record<string, number> = {};
      
      // Get counts for main process stages based on order status
      // Since getOrderCountsByStatus doesn't exist, we'll simulate it
      const orderStatusCounts: Partial<Record<OrderStatus, number>> = {};
      
      // Simulate counts for each status
      for (const status of Object.values(OrderStatus)) {
        try {
          const result = await this.orderRepository.findByStatus(status as OrderStatus);
          orderStatusCounts[status as OrderStatus] = result.items.length;
        } catch (error) {
          console.error(`Error getting count for status ${status}:`, error);
          orderStatusCounts[status as OrderStatus] = 0;
        }
      }
      
      // Map order status counts to process stages
      for (const [stage, statuses] of Object.entries(processStageMap)) {
        counts[stage] = statuses.reduce((sum, status) => {
          return sum + (orderStatusCounts[status] || 0);
        }, 0);
      }
      
      // Add counts for sub-processes based on main process counts
      // This is a simplified approach - in a real system, you would track sub-process states separately
      for (const node of mainProcessFlow.nodes) {
        if (node.type === 'sub' && node.parent && counts[node.parent]) {
          counts[node.id] = counts[node.parent];
        }
      }
      
      return counts;
    } catch (error) {
      console.error('Error getting process stage counts:', error);
      return {};
    }
  }

  /**
   * Get performance metrics for each process stage
   */
  private async getProcessMetrics(): Promise<Record<string, ProcessMetrics>> {
    try {
      const metrics: Record<string, ProcessMetrics> = {};
      
      // In a real system, these metrics would be calculated from actual order processing times
      // For this prototype, we'll use simulated metrics
      
      // Example metrics for main process stages
      metrics['order-reception'] = {
        averageTime: 5, // 5 minutes
        count: 120,
        errorRate: 2.5, // 2.5%
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
        bottleneck: true // This stage is a bottleneck
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
      
      // Add metrics for sub-processes based on main process metrics
      // This is a simplified approach - in a real system, you would track sub-process metrics separately
      for (const node of mainProcessFlow.nodes) {
        if (node.type === 'sub' && node.parent && metrics[node.parent]) {
          metrics[node.id] = {
            ...metrics[node.parent],
            averageTime: metrics[node.parent].averageTime / 2 // Simplification
          };
        }
      }
      
      return metrics;
    } catch (error) {
      console.error('Error getting process metrics:', error);
      return {};
    }
  }

  /**
   * Get the current process state for a specific order
   */
  private async getOrderProcessState(orderId: string): Promise<OrderProcessState | null> {
    try {
      // Get the order from the repository
      const order = await this.orderRepository.findById(orderId);
      
      if (!order) {
        return null;
      }
      
      // Determine the current stage based on order status
      let currentStage = '';
      for (const [stage, statuses] of Object.entries(processStageMap)) {
        if (statuses.includes(order.status as OrderStatus)) {
          currentStage = stage;
          break;
        }
      }
      
      // In a real system, you would retrieve the actual history from a tracking table
      // For this prototype, we'll simulate the history based on the current status
      const history = this.simulateOrderHistory(order.status as OrderStatus, order.createdAt);
      
      return {
        orderId,
        currentStage,
        history
      };
    } catch (error) {
      console.error(`Error getting process state for order ${orderId}:`, error);
      return null;
    }
  }

  /**
   * Simulate order history based on current status
   * In a real system, this would come from a tracking table
   */
  private simulateOrderHistory(status: OrderStatus, createdAt: Date): { stage: string; enteredAt: Date; completedAt?: Date; duration?: number }[] {
    const history: { stage: string; enteredAt: Date; completedAt?: Date; duration?: number }[] = [];
    const now = new Date();
    
    // Helper function to add minutes to a date
    const addMinutes = (date: Date, minutes: number) => {
      return new Date(date.getTime() + minutes * 60000);
    };
    
    // Add history entries based on the current status
    switch (status) {
      case OrderStatus.PENDING:
        history.push({
          stage: 'order-reception',
          enteredAt: createdAt,
          completedAt: undefined
        });
        break;
        
      case OrderStatus.CONSOLIDATED:
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
        
      case OrderStatus.ASSIGNED:
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
        
      case OrderStatus.ROUTED:
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
        
      case OrderStatus.DISPATCHED:
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
        
      case OrderStatus.IN_TRANSIT:
      case OrderStatus.DELIVERED:
      case OrderStatus.FAILED:
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
        
        if (status === OrderStatus.DELIVERED || status === OrderStatus.FAILED) {
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

  /**
   * Get recent orders in a specific process stage
   */
  private async getRecentOrdersInStage(stageId: string, limit: number): Promise<any[]> {
    try {
      // Find the statuses corresponding to this stage
      const stageStatuses = processStageMap[stageId as keyof typeof processStageMap];
      
      if (!stageStatuses || stageStatuses.length === 0) {
        return [];
      }
      
      // Since findByStatuses doesn't exist, we'll use findByStatus for each status and combine results
      let allOrders: any[] = [];
      
      for (const status of stageStatuses) {
        try {
          const result = await this.orderRepository.findByStatus(status);
          allOrders = [...allOrders, ...result.items];
        } catch (error) {
          console.error(`Error getting orders for status ${status}:`, error);
        }
      }
      
      // Sort by createdAt (newest first) and limit
      allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      allOrders = allOrders.slice(0, limit);
      
      return allOrders.map(order => ({
        id: order.id,
        customerName: order.customerName,
        status: order.status,
        createdAt: order.createdAt
      }));
    } catch (error) {
      console.error(`Error getting recent orders for stage ${stageId}:`, error);
      return [];
    }
  }

  /**
   * Detect bottlenecks in the process flow
   */
  async detectBottlenecks(): Promise<string[]> {
    try {
      const metrics = await this.getProcessMetrics();
      const bottlenecks: string[] = [];
      
      for (const [nodeId, nodeMetrics] of Object.entries(metrics)) {
        if (nodeMetrics.bottleneck) {
          bottlenecks.push(nodeId);
        }
      }
      
      return bottlenecks;
    } catch (error) {
      console.error('Error detecting bottlenecks:', error);
      return [];
    }
  }

  /**
   * Get performance metrics for the entire process
   */
  async getSystemMetrics(): Promise<any> {
    try {
      const metrics = await this.getProcessMetrics();
      
      // Calculate overall metrics
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
        averageTotalProcessingTime: totalTime, // minutes
        totalOrdersInSystem: totalCount,
        overallErrorRate: totalCount > 0 ? (totalErrors / totalCount) * 100 : 0,
        bottlenecks: bottlenecks.map(id => {
          const node = mainProcessFlow.nodes.find(n => n.id === id);
          return node ? node.name : id;
        }),
        stageMetrics: mainStages.map(stage => ({
          name: mainProcessFlow.nodes.find(n => n.id === stage)?.name || stage,
          metrics: metrics[stage] || { averageTime: 0, count: 0, errorRate: 0, bottleneck: false }
        }))
      };
    } catch (error) {
      console.error('Error getting system metrics:', error);
      throw new Error('Failed to get system metrics');
    }
  }
}
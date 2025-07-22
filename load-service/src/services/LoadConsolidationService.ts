import { Order, Load, LoadStatus, Package, TimeWindow } from '../../../shared/types';
import { OrderRepository } from '../../../shared/database/repositories/OrderRepository';
import { LoadRepository } from '../../../shared/database/repositories/LoadRepository';
import { v4 as uuidv4 } from 'uuid';

interface GroupingOptions {
  maxDistanceKm: number;
  maxWeightKg: number;
  maxVolumeM3: number;
  maxTimeWindowOverlapMinutes: number;
}

export class LoadConsolidationService {
  constructor(
    private orderRepository: OrderRepository,
    private loadRepository: LoadRepository,
    private defaultOptions: GroupingOptions = {
      maxDistanceKm: 10,
      maxWeightKg: 1000,
      maxVolumeM3: 10,
      maxTimeWindowOverlapMinutes: 120
    }
  ) {}

  /**
   * Groups orders by geographic proximity, considering weight, volume, and time window constraints
   * @param centerLatitude Center latitude for the geographic area
   * @param centerLongitude Center longitude for the geographic area
   * @param options Grouping options
   * @returns Array of grouped orders
   */
  async groupOrdersByGeographicArea(
    centerLatitude: number,
    centerLongitude: number,
    options: Partial<GroupingOptions> = {}
  ): Promise<Load[]> {
    // Merge default options with provided options
    const groupingOptions = { ...this.defaultOptions, ...options };
    
    // Find pending orders in the specified geographic area
    const pendingOrders = await this.orderRepository.findPendingOrdersInArea(
      centerLatitude,
      centerLongitude,
      groupingOptions.maxDistanceKm
    );

    if (pendingOrders.length === 0) {
      return [];
    }

    // Group orders based on capacity and time window constraints
    const loads: Load[] = [];
    let currentLoad: Partial<Load> = this.initializeNewLoad();
    let currentOrders: Order[] = [];
    
    // Sort orders by time window to optimize grouping
    const sortedOrders = this.sortOrdersByTimeWindow(pendingOrders);
    
    for (const order of sortedOrders) {
      const orderWeight = this.calculateTotalWeight(order.packageDetails);
      const orderVolume = this.calculateTotalVolume(order.packageDetails);
      
      // Check if adding this order would exceed capacity constraints
      if (
        currentLoad.totalWeight! + orderWeight > groupingOptions.maxWeightKg ||
        currentLoad.totalVolume! + orderVolume > groupingOptions.maxVolumeM3
      ) {
        // Current load is full, save it and start a new one
        if (currentOrders.length > 0) {
          const finalizedLoad = await this.finalizeLoad(currentLoad as Load, currentOrders);
          loads.push(finalizedLoad);
          
          // Start a new load
          currentLoad = this.initializeNewLoad();
          currentOrders = [];
        }
      }
      
      // Check time window compatibility with current load
      if (currentOrders.length > 0 && !this.areTimeWindowsCompatible(
        currentOrders,
        order,
        groupingOptions.maxTimeWindowOverlapMinutes
      )) {
        // Time windows are not compatible, save current load and start a new one
        const finalizedLoad = await this.finalizeLoad(currentLoad as Load, currentOrders);
        loads.push(finalizedLoad);
        
        // Start a new load
        currentLoad = this.initializeNewLoad();
        currentOrders = [];
      }
      
      // Add order to current load
      currentLoad.orders!.push(order.id);
      currentLoad.totalWeight! += orderWeight;
      currentLoad.totalVolume! += orderVolume;
      currentOrders.push(order);
    }
    
    // Save the last load if it has any orders
    if (currentOrders.length > 0) {
      const finalizedLoad = await this.finalizeLoad(currentLoad as Load, currentOrders);
      loads.push(finalizedLoad);
    }
    
    return loads;
  }
  
  /**
   * Calculates the total weight of all packages in an order
   * @param packages Array of packages
   * @returns Total weight in kg
   */
  private calculateTotalWeight(packages: Package[]): number {
    return packages.reduce((total, pkg) => total + pkg.weight, 0);
  }
  
  /**
   * Calculates the total volume of all packages in an order
   * @param packages Array of packages
   * @returns Total volume in cubic meters
   */
  private calculateTotalVolume(packages: Package[]): number {
    return packages.reduce((total, pkg) => {
      const { length, width, height } = pkg.dimensions;
      return total + (length * width * height) / 1000000; // Convert from cubic cm to cubic meters
    }, 0);
  }
  
  /**
   * Checks if a new order's time window is compatible with existing orders in a load
   * @param existingOrders Orders already in the load
   * @param newOrder Order to be added
   * @param maxOverlapMinutes Maximum allowed overlap in minutes
   * @returns Boolean indicating compatibility
   */
  private areTimeWindowsCompatible(
    existingOrders: Order[],
    newOrder: Order,
    maxOverlapMinutes: number
  ): boolean {
    // If any order doesn't have a time window, consider it compatible
    if (!newOrder.timeWindow) {
      return true;
    }
    
    // Check compatibility with each existing order that has a time window
    for (const existingOrder of existingOrders) {
      if (!existingOrder.timeWindow) {
        continue;
      }
      
      // Calculate overlap between time windows
      const overlap = this.calculateTimeWindowOverlap(
        existingOrder.timeWindow,
        newOrder.timeWindow
      );
      
      // If overlap is less than required, orders are not compatible
      if (overlap < maxOverlapMinutes) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Calculates the overlap between two time windows in minutes
   * @param window1 First time window
   * @param window2 Second time window
   * @returns Overlap in minutes
   */
  private calculateTimeWindowOverlap(window1: TimeWindow, window2: TimeWindow): number {
    const start = new Date(Math.max(window1.startTime.getTime(), window2.startTime.getTime()));
    const end = new Date(Math.min(window1.endTime.getTime(), window2.endTime.getTime()));
    
    // If end time is before start time, there's no overlap
    if (end < start) {
      return 0;
    }
    
    // Calculate overlap in minutes
    return (end.getTime() - start.getTime()) / (1000 * 60);
  }
  
  /**
   * Sorts orders by their time window start time
   * @param orders Array of orders
   * @returns Sorted array of orders
   */
  private sortOrdersByTimeWindow(orders: Order[]): Order[] {
    return [...orders].sort((a, b) => {
      // Orders without time windows come last
      if (!a.timeWindow && !b.timeWindow) return 0;
      if (!a.timeWindow) return 1;
      if (!b.timeWindow) return -1;
      
      // Sort by start time
      return a.timeWindow.startTime.getTime() - b.timeWindow.startTime.getTime();
    });
  }
  
  /**
   * Initializes a new empty load
   * @returns Partial Load object
   */
  private initializeNewLoad(): Partial<Load> {
    return {
      orders: [],
      totalWeight: 0,
      totalVolume: 0,
      status: LoadStatus.PENDING
    };
  }
  
  /**
   * Finalizes a load by saving it to the database and updating order statuses
   * @param load Load to finalize
   * @param orders Orders in the load
   * @returns Completed Load object
   */
  private async finalizeLoad(load: Load, orders: Order[]): Promise<Load> {
    // Create the load in the database
    const createdLoad = await this.loadRepository.create({
      orders: load.orders,
      totalWeight: load.totalWeight,
      totalVolume: load.totalVolume,
      status: LoadStatus.CONSOLIDATED
    } as any);
    
    // Update status of all orders in the load
    for (const order of orders) {
      await this.orderRepository.updateStatus(order.id, 'consolidated' as any);
    }
    
    return createdLoad;
  }
  
  /**
   * Checks if a load can accommodate an additional order
   * @param load Current load
   * @param order Order to add
   * @param maxWeightKg Maximum weight capacity
   * @param maxVolumeM3 Maximum volume capacity
   * @returns Boolean indicating if order can be added
   */
  async canAddOrderToLoad(
    load: Load,
    order: Order,
    maxWeightKg: number = this.defaultOptions.maxWeightKg,
    maxVolumeM3: number = this.defaultOptions.maxVolumeM3
  ): Promise<boolean> {
    const orderWeight = this.calculateTotalWeight(order.packageDetails);
    const orderVolume = this.calculateTotalVolume(order.packageDetails);
    
    // Check capacity constraints
    if (
      load.totalWeight + orderWeight > maxWeightKg ||
      load.totalVolume + orderVolume > maxVolumeM3
    ) {
      return false;
    }
    
    // Get all orders in the load to check time window compatibility
    const orderIds = load.orders;
    const ordersInLoad: Order[] = [];
    
    for (const orderId of orderIds) {
      const orderInLoad = await this.orderRepository.findById(orderId);
      if (orderInLoad) {
        ordersInLoad.push(orderInLoad);
      }
    }
    
    // Check time window compatibility
    return this.areTimeWindowsCompatible(
      ordersInLoad,
      order,
      this.defaultOptions.maxTimeWindowOverlapMinutes
    );
  }
  
  /**
   * Adds an order to an existing load if capacity constraints allow
   * @param loadId ID of the load
   * @param orderId ID of the order to add
   * @returns Updated load or null if addition failed
   */
  async addOrderToLoad(loadId: string, orderId: string): Promise<Load | null> {
    const load = await this.loadRepository.findById(loadId);
    const order = await this.orderRepository.findById(orderId);
    
    if (!load || !order) {
      return null;
    }
    
    // Check if order can be added to load
    const canAdd = await this.canAddOrderToLoad(load, order);
    if (!canAdd) {
      return null;
    }
    
    // Add order to load
    const orderWeight = this.calculateTotalWeight(order.packageDetails);
    const orderVolume = this.calculateTotalVolume(order.packageDetails);
    
    const updatedLoad = await this.loadRepository.update(loadId, {
      orders: [...load.orders, orderId],
      totalWeight: load.totalWeight + orderWeight,
      totalVolume: load.totalVolume + orderVolume
    } as any);
    
    // Update order status
    await this.orderRepository.updateStatus(orderId, 'consolidated' as any);
    
    return updatedLoad;
  }
  
  /**
   * Removes an order from a load
   * @param loadId ID of the load
   * @param orderId ID of the order to remove
   * @returns Updated load or null if removal failed
   */
  async removeOrderFromLoad(loadId: string, orderId: string): Promise<Load | null> {
    const load = await this.loadRepository.findById(loadId);
    const order = await this.orderRepository.findById(orderId);
    
    if (!load || !order || !load.orders.includes(orderId)) {
      return null;
    }
    
    // Calculate weight and volume to subtract
    const orderWeight = this.calculateTotalWeight(order.packageDetails);
    const orderVolume = this.calculateTotalVolume(order.packageDetails);
    
    // Remove order from load
    const updatedLoad = await this.loadRepository.update(loadId, {
      orders: load.orders.filter(id => id !== orderId),
      totalWeight: Math.max(0, load.totalWeight - orderWeight),
      totalVolume: Math.max(0, load.totalVolume - orderVolume)
    } as any);
    
    // Update order status back to pending
    await this.orderRepository.updateStatus(orderId, 'pending' as any);
    
    return updatedLoad;
  }
  
  /**
   * Detects conflicts in delivery requirements between orders in a load
   * @param loadId ID of the load to check
   * @returns Array of conflict descriptions
   */
  async detectDeliveryConflicts(loadId: string): Promise<string[]> {
    const load = await this.loadRepository.findById(loadId);
    if (!load) {
      return [];
    }
    
    const conflicts: string[] = [];
    const orders: Order[] = [];
    
    // Get all orders in the load
    for (const orderId of load.orders) {
      const order = await this.orderRepository.findById(orderId);
      if (order) {
        orders.push(order);
      }
    }
    
    // Check for time window conflicts
    for (let i = 0; i < orders.length; i++) {
      for (let j = i + 1; j < orders.length; j++) {
        const order1 = orders[i];
        const order2 = orders[j];
        
        if (order1.timeWindow && order2.timeWindow) {
          const overlap = this.calculateTimeWindowOverlap(order1.timeWindow, order2.timeWindow);
          
          if (overlap < this.defaultOptions.maxTimeWindowOverlapMinutes) {
            conflicts.push(`Time window conflict between orders ${order1.id} and ${order2.id}: insufficient overlap (${overlap} minutes)`);
          }
        }
      }
    }
    
    // Check for special instructions conflicts
    const specialInstructionsOrders = orders.filter(order => order.specialInstructions);
    if (specialInstructionsOrders.length > 0) {
      conflicts.push(`Load contains ${specialInstructionsOrders.length} orders with special instructions that may require attention`);
    }
    
    // Check for fragile items
    const fragileItemsCount = orders.reduce((count, order) => {
      return count + order.packageDetails.filter(pkg => pkg.fragile).length;
    }, 0);
    
    if (fragileItemsCount > 0) {
      conflicts.push(`Load contains ${fragileItemsCount} fragile items that require careful handling`);
    }
    
    return conflicts;
  }
}
import { v4 as uuidv4 } from 'uuid';
import { Order } from '../../../shared/types/entities/Order';
import { OrderStatus } from '../../../shared/types/enums/OrderStatus';
import { OrderRepository } from '../../../shared/database/repositories/OrderRepository';
import { NotFoundError, ApiError } from '../middleware/errorHandler';
import { OrderValidator } from '../validators/OrderValidator';
import { RedisClientType } from 'redis';

export class OrderService {
  private orderRepository: OrderRepository;
  private redisClient: RedisClientType | null;
  private readonly ORDER_ID_PREFIX = 'ORD';
  private readonly MANUAL_REVIEW_FLAG = 'REVIEW';
  private readonly ORDER_COUNTER_KEY = 'order:counter';

  constructor(orderRepository: OrderRepository, redisClient: RedisClientType | null = null) {
    this.orderRepository = orderRepository;
    this.redisClient = redisClient;
  }

  /**
   * Creates a new order with unique ID and timestamp
   */
  async createOrder(orderData: Omit<Order, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    // Generate a unique order ID
    const orderId = await this.generateUniqueOrderId();
    
    // Add default values for new orders
    const newOrder = {
      ...orderData,
      id: orderId,
      status: OrderStatus.PENDING,
      // Add package IDs if not provided
      packageDetails: orderData.packageDetails.map(pkg => ({
        ...pkg,
        id: pkg.id || uuidv4()
      }))
    };

    // Check for special instructions that might need manual review
    const needsReview = OrderValidator.needsManualReview(newOrder);
    if (needsReview) {
      await this.flagOrderForManualReview(orderId, newOrder);
    }

    return this.orderRepository.create(newOrder);
  }

  /**
   * Retrieves an order by its ID
   */
  async getOrderById(id: string): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError(`Order with ID ${id} not found`);
    }
    return order;
  }

  /**
   * Retrieves all orders with optional pagination
   */
  async getAllOrders(limit?: number, offset?: number): Promise<Order[]> {
    return this.orderRepository.findAll(limit, offset);
  }

  /**
   * Updates an existing order
   */
  async updateOrder(id: string, updates: Partial<Omit<Order, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError(`Order with ID ${id} not found`);
    }

    // If updating package details, ensure all packages have IDs
    if (updates.packageDetails) {
      updates.packageDetails = updates.packageDetails.map(pkg => ({
        ...pkg,
        id: pkg.id || uuidv4()
      }));
    }

    // Check if the update contains special instructions that need review
    if (updates.specialInstructions && 
        !order.specialInstructions?.includes(this.MANUAL_REVIEW_FLAG) && 
        OrderValidator.needsManualReview({...order, ...updates})) {
      await this.flagOrderForManualReview(id, {...order, ...updates});
    }

    const updatedOrder = await this.orderRepository.update(id, updates);
    if (!updatedOrder) {
      throw new ApiError(500, `Failed to update order with ID ${id}`);
    }

    return updatedOrder;
  }

  /**
   * Deletes an order by ID
   */
  async deleteOrder(id: string): Promise<boolean> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError(`Order with ID ${id} not found`);
    }

    // Remove any manual review flags if they exist
    if (this.redisClient) {
      try {
        await this.redisClient.del(`order:review:${id}`);
      } catch (error) {
        console.error(`Failed to remove review flag for order ${id}:`, error);
      }
    }

    return this.orderRepository.delete(id);
  }

  /**
   * Retrieves orders by status
   */
  async getOrdersByStatus(status: OrderStatus, page: number = 1, pageSize: number = 20): Promise<{
    items: Order[];
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    }
  }> {
    return this.orderRepository.findByStatus(status, page, pageSize);
  }

  /**
   * Retrieves orders by customer ID
   */
  async getOrdersByCustomerId(customerId: string): Promise<Order[]> {
    return this.orderRepository.findByCustomerId(customerId);
  }

  /**
   * Updates the status of an order
   */
  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError(`Order with ID ${id} not found`);
    }

    // Validate status transition
    this.validateStatusTransition(order.status, status);

    const updatedOrder = await this.orderRepository.updateStatus(id, status);
    if (!updatedOrder) {
      throw new ApiError(500, `Failed to update status for order with ID ${id}`);
    }

    return updatedOrder;
  }

  /**
   * Retrieves orders that need manual review
   */
  async getOrdersNeedingReview(): Promise<Order[]> {
    if (!this.redisClient) {
      return [];
    }

    try {
      // Get all order IDs flagged for review
      const orderIds = await this.redisClient.sMembers('orders:needs_review');
      
      if (!orderIds.length) {
        return [];
      }

      // Fetch each order from the database
      const orders: Order[] = [];
      for (const id of orderIds) {
        const order = await this.orderRepository.findById(id);
        if (order) {
          orders.push(order);
        }
      }

      return orders;
    } catch (error) {
      console.error('Failed to get orders needing review:', error);
      return [];
    }
  }

  /**
   * Generates a unique order ID with prefix and sequential number
   */
  private async generateUniqueOrderId(): Promise<string> {
    let orderNumber: number;
    
    // Use Redis for sequential IDs if available
    if (this.redisClient) {
      try {
        orderNumber = await this.redisClient.incr(this.ORDER_COUNTER_KEY);
      } catch (error) {
        console.error('Failed to generate order number from Redis:', error);
        orderNumber = Math.floor(Math.random() * 1000000);
      }
    } else {
      // Fallback to timestamp-based ID if Redis is not available
      orderNumber = Date.now() % 1000000;
    }
    
    // Format the order number with leading zeros
    const formattedNumber = orderNumber.toString().padStart(6, '0');
    
    // Generate a unique ID with prefix, formatted number, and random suffix
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${this.ORDER_ID_PREFIX}-${formattedNumber}-${randomSuffix}`;
  }

  /**
   * Flags an order for manual review
   */
  private async flagOrderForManualReview(orderId: string, orderData: any): Promise<void> {
    console.log(`Order ${orderId} flagged for manual review: ${JSON.stringify(orderData.specialInstructions)}`);
    
    // Store in Redis if available
    if (this.redisClient) {
      try {
        // Add to set of orders needing review
        await this.redisClient.sAdd('orders:needs_review', orderId);
        
        // Store review reason
        const reviewReason = this.getReviewReason(orderData);
        await this.redisClient.set(`order:review:${orderId}`, reviewReason);
        
        // Could add additional logic here like sending notifications
      } catch (error) {
        console.error(`Failed to flag order ${orderId} for review in Redis:`, error);
      }
    }
  }

  /**
   * Determines the reason an order needs manual review
   */
  private getReviewReason(order: any): string {
    const reasons: string[] = [];
    
    // Check special instructions
    if (order.specialInstructions) {
      const instructions = order.specialInstructions.toLowerCase();
      const matchedKeywords = OrderValidator.SPECIAL_KEYWORDS.filter(keyword => 
        instructions.includes(keyword.toLowerCase())
      );
      
      if (matchedKeywords && matchedKeywords.length > 0) {
        reasons.push(`Special instructions contain keywords: ${matchedKeywords.join(', ')}`);
      }
    }
    
    // Check for large or heavy packages
    if (order.packageDetails && order.packageDetails.length > 0) {
      order.packageDetails.forEach((pkg: any, index: number) => {
        if (pkg.weight > 50) {
          reasons.push(`Package ${index + 1} exceeds weight limit (${pkg.weight} kg)`);
        }
        
        if (pkg.dimensions && 
            (pkg.dimensions.length > 200 || 
             pkg.dimensions.width > 200 || 
             pkg.dimensions.height > 200)) {
          reasons.push(`Package ${index + 1} has oversized dimensions`);
        }
        
        if (pkg.fragile) {
          reasons.push(`Package ${index + 1} is marked as fragile`);
        }
      });
    }
    
    return reasons.length > 0 ? reasons.join('; ') : 'Unknown reason';
  }

  /**
   * Validates that a status transition is allowed
   */
  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    // Define allowed status transitions
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONSOLIDATED, OrderStatus.CANCELLED],
      [OrderStatus.CONSOLIDATED]: [OrderStatus.ASSIGNED, OrderStatus.PENDING, OrderStatus.CANCELLED],
      [OrderStatus.ASSIGNED]: [OrderStatus.ROUTED, OrderStatus.CONSOLIDATED, OrderStatus.CANCELLED],
      [OrderStatus.ROUTED]: [OrderStatus.DISPATCHED, OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
      [OrderStatus.DISPATCHED]: [OrderStatus.IN_TRANSIT, OrderStatus.ROUTED, OrderStatus.CANCELLED],
      [OrderStatus.IN_TRANSIT]: [OrderStatus.DELIVERED, OrderStatus.FAILED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.FAILED]: [OrderStatus.PENDING],
      [OrderStatus.CANCELLED]: [OrderStatus.PENDING]
    };
    
    // Check if the transition is allowed
    if (!allowedTransitions[currentStatus].includes(newStatus) && currentStatus !== newStatus) {
      throw new ApiError(400, `Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }
}
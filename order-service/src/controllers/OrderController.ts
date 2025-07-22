import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/OrderService';
import { OrderValidator } from '../validators/OrderValidator';
import { OrderStatus } from '../../../shared/types/enums/OrderStatus';
import { ApiError } from '../middleware/errorHandler';

export class OrderController {
  private orderService: OrderService;

  constructor(orderService: OrderService) {
    this.orderService = orderService;
  }

  // Create a new order
  async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      OrderValidator.validateCreate(req.body);
      
      // Create order
      const order = await this.orderService.createOrder(req.body);
      
      // Check if order needs manual review
      const needsReview = OrderValidator.needsManualReview(req.body);
      
      res.status(201).json({
        message: 'Order created successfully',
        data: order,
        needsManualReview: needsReview
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all orders with optional pagination
  async getAllOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      // Validate pagination parameters
      if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
        throw new ApiError(400, 'Invalid pagination parameters');
      }
      
      const orders = await this.orderService.getAllOrders(limit, offset);
      
      res.status(200).json({
        message: 'Orders retrieved successfully',
        data: orders,
        pagination: {
          limit,
          offset,
          count: orders.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get order by ID
  async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate ID format
      OrderValidator.validateId(id);
      
      const order = await this.orderService.getOrderById(id);
      
      res.status(200).json({
        message: 'Order retrieved successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  // Update order
  async updateOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate ID format and request body
      OrderValidator.validateId(id);
      OrderValidator.validateUpdate(req.body);
      
      const updatedOrder = await this.orderService.updateOrder(id, req.body);
      
      // Check if updated order needs manual review
      const needsReview = OrderValidator.needsManualReview({...updatedOrder, ...req.body});
      
      res.status(200).json({
        message: 'Order updated successfully',
        data: updatedOrder,
        needsManualReview: needsReview
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete order
  async deleteOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate ID format
      OrderValidator.validateId(id);
      
      await this.orderService.deleteOrder(id);
      
      res.status(200).json({
        message: 'Order deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get orders by status
  async getOrdersByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.params;
      
      // Validate status
      if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
        throw new ApiError(400, 'Invalid order status');
      }
      
      const result = await this.orderService.getOrdersByStatus(status as OrderStatus);
      
      res.status(200).json({
        message: 'Orders retrieved successfully',
        data: result.items,
        pagination: result.pagination,
        count: result.items.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Update order status
  async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Validate ID format and status
      OrderValidator.validateId(id);
      if (!status || !Object.values(OrderStatus).includes(status as OrderStatus)) {
        throw new ApiError(400, 'Invalid order status');
      }
      
      const updatedOrder = await this.orderService.updateOrderStatus(id, status as OrderStatus);
      
      res.status(200).json({
        message: 'Order status updated successfully',
        data: updatedOrder
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Get orders that need manual review
  async getOrdersNeedingReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await this.orderService.getOrdersNeedingReview();
      
      res.status(200).json({
        message: 'Orders needing review retrieved successfully',
        data: orders,
        count: orders.length
      });
    } catch (error) {
      next(error);
    }
  }
}
import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { OrderService } from '../services/OrderService';
import { OrderRepository } from '../../../shared/database/repositories/OrderRepository';
import { Pool } from 'pg';
import { RedisClientType } from 'redis';

/**
 * @swagger
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       required:
 *         - street
 *         - city
 *         - state
 *         - zipCode
 *         - coordinates
 *       properties:
 *         street:
 *           type: string
 *           description: Street address
 *         city:
 *           type: string
 *           description: City name
 *         state:
 *           type: string
 *           description: State or province
 *         zipCode:
 *           type: string
 *           description: Postal code
 *         coordinates:
 *           $ref: '#/components/schemas/Location'
 *       example:
 *         street: "123 Main St"
 *         city: "Springfield"
 *         state: "IL"
 *         zipCode: "62701"
 *         coordinates:
 *           latitude: 39.78
 *           longitude: -89.65
 *
 *     Location:
 *       type: object
 *       required:
 *         - latitude
 *         - longitude
 *       properties:
 *         latitude:
 *           type: number
 *           format: float
 *           description: Latitude coordinate
 *         longitude:
 *           type: number
 *           format: float
 *           description: Longitude coordinate
 *       example:
 *         latitude: 39.78
 *         longitude: -89.65
 *
 *     Dimensions:
 *       type: object
 *       required:
 *         - length
 *         - width
 *         - height
 *       properties:
 *         length:
 *           type: number
 *           format: float
 *           description: Length in centimeters
 *         width:
 *           type: number
 *           format: float
 *           description: Width in centimeters
 *         height:
 *           type: number
 *           format: float
 *           description: Height in centimeters
 *       example:
 *         length: 30
 *         width: 20
 *         height: 15
 *
 *     Package:
 *       type: object
 *       required:
 *         - id
 *         - description
 *         - weight
 *         - dimensions
 *         - fragile
 *       properties:
 *         id:
 *           type: string
 *           description: Package identifier
 *         description:
 *           type: string
 *           description: Package description
 *         weight:
 *           type: number
 *           format: float
 *           description: Weight in kilograms
 *         dimensions:
 *           $ref: '#/components/schemas/Dimensions'
 *         fragile:
 *           type: boolean
 *           description: Whether the package is fragile
 *       example:
 *         id: "pkg-123"
 *         description: "Electronics box"
 *         weight: 2.5
 *         dimensions:
 *           length: 30
 *           width: 20
 *           height: 15
 *         fragile: true
 *
 *     TimeWindow:
 *       type: object
 *       required:
 *         - start
 *         - end
 *       properties:
 *         start:
 *           type: string
 *           format: date-time
 *           description: Start time of delivery window
 *         end:
 *           type: string
 *           format: date-time
 *           description: End time of delivery window
 *       example:
 *         start: "2025-07-21T09:00:00Z"
 *         end: "2025-07-21T12:00:00Z"
 *
 *     Order:
 *       type: object
 *       required:
 *         - customerId
 *         - customerName
 *         - customerPhone
 *         - deliveryAddress
 *         - packageDetails
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           description: Order unique identifier
 *         customerId:
 *           type: string
 *           description: Customer unique identifier
 *         customerName:
 *           type: string
 *           description: Customer full name
 *         customerPhone:
 *           type: string
 *           description: Customer phone number
 *         deliveryAddress:
 *           $ref: '#/components/schemas/Address'
 *         packageDetails:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Package'
 *           description: List of packages in the order
 *         specialInstructions:
 *           type: string
 *           description: Special delivery instructions
 *         timeWindow:
 *           $ref: '#/components/schemas/TimeWindow'
 *         status:
 *           type: string
 *           enum: [pending, consolidated, assigned, routed, dispatched, in_transit, delivered, failed, cancelled]
 *           description: Current order status
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Order creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Order last update timestamp
 *       example:
 *         id: "ord-123456"
 *         customerId: "cust-789"
 *         customerName: "John Doe"
 *         customerPhone: "+1234567890"
 *         deliveryAddress:
 *           street: "123 Main St"
 *           city: "Springfield"
 *           state: "IL"
 *           zipCode: "62701"
 *           coordinates:
 *             latitude: 39.78
 *             longitude: -89.65
 *         packageDetails:
 *           - id: "pkg-123"
 *             description: "Electronics box"
 *             weight: 2.5
 *             dimensions:
 *               length: 30
 *               width: 20
 *               height: 15
 *             fragile: true
 *         specialInstructions: "Please call before delivery"
 *         timeWindow:
 *           start: "2025-07-21T09:00:00Z"
 *           end: "2025-07-21T12:00:00Z"
 *         status: "pending"
 *         createdAt: "2025-07-20T15:30:00Z"
 *         updatedAt: "2025-07-20T15:30:00Z"
 *
 *     CreateOrderRequest:
 *       type: object
 *       required:
 *         - customerId
 *         - customerName
 *         - customerPhone
 *         - deliveryAddress
 *         - packageDetails
 *       properties:
 *         customerId:
 *           type: string
 *           description: Customer unique identifier
 *         customerName:
 *           type: string
 *           description: Customer full name
 *         customerPhone:
 *           type: string
 *           description: Customer phone number
 *         deliveryAddress:
 *           $ref: '#/components/schemas/Address'
 *         packageDetails:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Package'
 *           description: List of packages in the order
 *         specialInstructions:
 *           type: string
 *           description: Special delivery instructions
 *         timeWindow:
 *           $ref: '#/components/schemas/TimeWindow'
 *
 *     UpdateOrderRequest:
 *       type: object
 *       properties:
 *         customerName:
 *           type: string
 *           description: Customer full name
 *         customerPhone:
 *           type: string
 *           description: Customer phone number
 *         deliveryAddress:
 *           $ref: '#/components/schemas/Address'
 *         packageDetails:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Package'
 *           description: List of packages in the order
 *         specialInstructions:
 *           type: string
 *           description: Special delivery instructions
 *         timeWindow:
 *           $ref: '#/components/schemas/TimeWindow'
 *
 *     UpdateOrderStatusRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, consolidated, assigned, routed, dispatched, in_transit, delivered, failed, cancelled]
 *           description: New order status
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *               description: Error code
 *             message:
 *               type: string
 *               description: Error message
 *             details:
 *               type: object
 *               description: Additional error details
 *             timestamp:
 *               type: string
 *               format: date-time
 *               description: Error timestamp
 *             requestId:
 *               type: string
 *               description: Request identifier for tracking
 */

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints
 */

export const createOrderRouter = (pool: Pool, redisClient: RedisClientType | null = null): Router => {
  const router = Router();
  const orderRepository = new OrderRepository(pool);
  const orderService = new OrderService(orderRepository, redisClient);
  const orderController = new OrderController(orderService);

  // Bind controller methods to avoid 'this' context issues
  const createOrder = orderController.createOrder.bind(orderController);
  const getAllOrders = orderController.getAllOrders.bind(orderController);
  const getOrderById = orderController.getOrderById.bind(orderController);
  const updateOrder = orderController.updateOrder.bind(orderController);
  const deleteOrder = orderController.deleteOrder.bind(orderController);
  const getOrdersByStatus = orderController.getOrdersByStatus.bind(orderController);
  const updateOrderStatus = orderController.updateOrderStatus.bind(orderController);
  const getOrdersNeedingReview = orderController.getOrdersNeedingReview.bind(orderController);

  /**
   * @swagger
   * /api/orders:
   *   post:
   *     summary: Create a new order
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateOrderRequest'
   *     responses:
   *       201:
   *         description: Order created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Order created successfully
   *                 data:
   *                   $ref: '#/components/schemas/Order'
   *                 needsManualReview:
   *                   type: boolean
   *                   example: false
   *       400:
   *         description: Invalid request data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post('/', createOrder);

  /**
   * @swagger
   * /api/orders:
   *   get:
   *     summary: Get all orders with pagination
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *         description: Maximum number of orders to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of orders to skip
   *     responses:
   *       200:
   *         description: List of orders
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Orders retrieved successfully
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Order'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     limit:
   *                       type: integer
   *                       example: 100
   *                     offset:
   *                       type: integer
   *                       example: 0
   *                     count:
   *                       type: integer
   *                       example: 10
   *       400:
   *         description: Invalid pagination parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/', getAllOrders);

  /**
   * @swagger
   * /api/orders/review:
   *   get:
   *     summary: Get orders that need manual review
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of orders needing review
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Orders needing review retrieved successfully
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Order'
   *                 count:
   *                   type: integer
   *                   example: 5
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/review', getOrdersNeedingReview); // Must be before /:id route to avoid conflict

  /**
   * @swagger
   * /api/orders/status/{status}:
   *   get:
   *     summary: Get orders by status
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: status
   *         required: true
   *         schema:
   *           type: string
   *           enum: [pending, consolidated, assigned, routed, dispatched, in_transit, delivered, failed, cancelled]
   *         description: Order status to filter by
   *     responses:
   *       200:
   *         description: List of orders with the specified status
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Orders retrieved successfully
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Order'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     limit:
   *                       type: integer
   *                       example: 100
   *                     offset:
   *                       type: integer
   *                       example: 0
   *                 count:
   *                   type: integer
   *                   example: 8
   *       400:
   *         description: Invalid order status
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/status/:status', getOrdersByStatus);

  /**
   * @swagger
   * /api/orders/{id}:
   *   get:
   *     summary: Get order by ID
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Order ID
   *     responses:
   *       200:
   *         description: Order details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Order retrieved successfully
   *                 data:
   *                   $ref: '#/components/schemas/Order'
   *       400:
   *         description: Invalid order ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Order not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get('/:id', getOrderById);

  /**
   * @swagger
   * /api/orders/{id}:
   *   put:
   *     summary: Update an order
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Order ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateOrderRequest'
   *     responses:
   *       200:
   *         description: Order updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Order updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/Order'
   *                 needsManualReview:
   *                   type: boolean
   *                   example: false
   *       400:
   *         description: Invalid request data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Order not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.put('/:id', updateOrder);

  /**
   * @swagger
   * /api/orders/{id}:
   *   delete:
   *     summary: Delete an order
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Order ID
   *     responses:
   *       200:
   *         description: Order deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Order deleted successfully
   *       400:
   *         description: Invalid order ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Order not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.delete('/:id', deleteOrder);

  /**
   * @swagger
   * /api/orders/{id}/status:
   *   patch:
   *     summary: Update order status
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Order ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateOrderStatusRequest'
   *     responses:
   *       200:
   *         description: Order status updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Order status updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/Order'
   *       400:
   *         description: Invalid request data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Order not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.patch('/:id/status', updateOrderStatus);

  return router;
};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const OrderValidator_1 = require("../validators/OrderValidator");
const OrderStatus_1 = require("../../../shared/types/enums/OrderStatus");
const errorHandler_1 = require("../middleware/errorHandler");
class OrderController {
    constructor(orderService) {
        this.orderService = orderService;
    }
    async createOrder(req, res, next) {
        try {
            OrderValidator_1.OrderValidator.validateCreate(req.body);
            const order = await this.orderService.createOrder(req.body);
            const needsReview = OrderValidator_1.OrderValidator.needsManualReview(req.body);
            res.status(201).json({
                message: 'Order created successfully',
                data: order,
                needsManualReview: needsReview
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAllOrders(req, res, next) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 100;
            const offset = req.query.offset ? parseInt(req.query.offset) : 0;
            if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
                throw new errorHandler_1.ApiError(400, 'Invalid pagination parameters');
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
        }
        catch (error) {
            next(error);
        }
    }
    async getOrderById(req, res, next) {
        try {
            const { id } = req.params;
            OrderValidator_1.OrderValidator.validateId(id);
            const order = await this.orderService.getOrderById(id);
            res.status(200).json({
                message: 'Order retrieved successfully',
                data: order
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateOrder(req, res, next) {
        try {
            const { id } = req.params;
            OrderValidator_1.OrderValidator.validateId(id);
            OrderValidator_1.OrderValidator.validateUpdate(req.body);
            const updatedOrder = await this.orderService.updateOrder(id, req.body);
            const needsReview = OrderValidator_1.OrderValidator.needsManualReview({ ...updatedOrder, ...req.body });
            res.status(200).json({
                message: 'Order updated successfully',
                data: updatedOrder,
                needsManualReview: needsReview
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteOrder(req, res, next) {
        try {
            const { id } = req.params;
            OrderValidator_1.OrderValidator.validateId(id);
            await this.orderService.deleteOrder(id);
            res.status(200).json({
                message: 'Order deleted successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getOrdersByStatus(req, res, next) {
        try {
            const { status } = req.params;
            if (!Object.values(OrderStatus_1.OrderStatus).includes(status)) {
                throw new errorHandler_1.ApiError(400, 'Invalid order status');
            }
            const result = await this.orderService.getOrdersByStatus(status);
            res.status(200).json({
                message: 'Orders retrieved successfully',
                data: result.items,
                pagination: result.pagination,
                count: result.items.length
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateOrderStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            OrderValidator_1.OrderValidator.validateId(id);
            if (!status || !Object.values(OrderStatus_1.OrderStatus).includes(status)) {
                throw new errorHandler_1.ApiError(400, 'Invalid order status');
            }
            const updatedOrder = await this.orderService.updateOrderStatus(id, status);
            res.status(200).json({
                message: 'Order status updated successfully',
                data: updatedOrder
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getOrdersNeedingReview(req, res, next) {
        try {
            const orders = await this.orderService.getOrdersNeedingReview();
            res.status(200).json({
                message: 'Orders needing review retrieved successfully',
                data: orders,
                count: orders.length
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.OrderController = OrderController;
//# sourceMappingURL=OrderController.js.map
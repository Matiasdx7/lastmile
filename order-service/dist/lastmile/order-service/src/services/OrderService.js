"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const uuid_1 = require("uuid");
const OrderStatus_1 = require("../../../shared/types/enums/OrderStatus");
const errorHandler_1 = require("../middleware/errorHandler");
const OrderValidator_1 = require("../validators/OrderValidator");
class OrderService {
    constructor(orderRepository, redisClient = null) {
        this.ORDER_ID_PREFIX = 'ORD';
        this.MANUAL_REVIEW_FLAG = 'REVIEW';
        this.ORDER_COUNTER_KEY = 'order:counter';
        this.orderRepository = orderRepository;
        this.redisClient = redisClient;
    }
    async createOrder(orderData) {
        const orderId = await this.generateUniqueOrderId();
        const newOrder = {
            ...orderData,
            id: orderId,
            status: OrderStatus_1.OrderStatus.PENDING,
            packageDetails: orderData.packageDetails.map(pkg => ({
                ...pkg,
                id: pkg.id || (0, uuid_1.v4)()
            }))
        };
        const needsReview = OrderValidator_1.OrderValidator.needsManualReview(newOrder);
        if (needsReview) {
            await this.flagOrderForManualReview(orderId, newOrder);
        }
        return this.orderRepository.create(newOrder);
    }
    async getOrderById(id) {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            throw new errorHandler_1.NotFoundError(`Order with ID ${id} not found`);
        }
        return order;
    }
    async getAllOrders(limit, offset) {
        return this.orderRepository.findAll(limit, offset);
    }
    async updateOrder(id, updates) {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            throw new errorHandler_1.NotFoundError(`Order with ID ${id} not found`);
        }
        if (updates.packageDetails) {
            updates.packageDetails = updates.packageDetails.map(pkg => ({
                ...pkg,
                id: pkg.id || (0, uuid_1.v4)()
            }));
        }
        if (updates.specialInstructions &&
            !order.specialInstructions?.includes(this.MANUAL_REVIEW_FLAG) &&
            OrderValidator_1.OrderValidator.needsManualReview({ ...order, ...updates })) {
            await this.flagOrderForManualReview(id, { ...order, ...updates });
        }
        const updatedOrder = await this.orderRepository.update(id, updates);
        if (!updatedOrder) {
            throw new errorHandler_1.ApiError(500, `Failed to update order with ID ${id}`);
        }
        return updatedOrder;
    }
    async deleteOrder(id) {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            throw new errorHandler_1.NotFoundError(`Order with ID ${id} not found`);
        }
        if (this.redisClient) {
            try {
                await this.redisClient.del(`order:review:${id}`);
            }
            catch (error) {
                console.error(`Failed to remove review flag for order ${id}:`, error);
            }
        }
        return this.orderRepository.delete(id);
    }
    async getOrdersByStatus(status, page = 1, pageSize = 20) {
        return this.orderRepository.findByStatus(status, page, pageSize);
    }
    async getOrdersByCustomerId(customerId) {
        return this.orderRepository.findByCustomerId(customerId);
    }
    async updateOrderStatus(id, status) {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            throw new errorHandler_1.NotFoundError(`Order with ID ${id} not found`);
        }
        this.validateStatusTransition(order.status, status);
        const updatedOrder = await this.orderRepository.updateStatus(id, status);
        if (!updatedOrder) {
            throw new errorHandler_1.ApiError(500, `Failed to update status for order with ID ${id}`);
        }
        return updatedOrder;
    }
    async getOrdersNeedingReview() {
        if (!this.redisClient) {
            return [];
        }
        try {
            const orderIds = await this.redisClient.sMembers('orders:needs_review');
            if (!orderIds.length) {
                return [];
            }
            const orders = [];
            for (const id of orderIds) {
                const order = await this.orderRepository.findById(id);
                if (order) {
                    orders.push(order);
                }
            }
            return orders;
        }
        catch (error) {
            console.error('Failed to get orders needing review:', error);
            return [];
        }
    }
    async generateUniqueOrderId() {
        let orderNumber;
        if (this.redisClient) {
            try {
                orderNumber = await this.redisClient.incr(this.ORDER_COUNTER_KEY);
            }
            catch (error) {
                console.error('Failed to generate order number from Redis:', error);
                orderNumber = Math.floor(Math.random() * 1000000);
            }
        }
        else {
            orderNumber = Date.now() % 1000000;
        }
        const formattedNumber = orderNumber.toString().padStart(6, '0');
        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${this.ORDER_ID_PREFIX}-${formattedNumber}-${randomSuffix}`;
    }
    async flagOrderForManualReview(orderId, orderData) {
        console.log(`Order ${orderId} flagged for manual review: ${JSON.stringify(orderData.specialInstructions)}`);
        if (this.redisClient) {
            try {
                await this.redisClient.sAdd('orders:needs_review', orderId);
                const reviewReason = this.getReviewReason(orderData);
                await this.redisClient.set(`order:review:${orderId}`, reviewReason);
            }
            catch (error) {
                console.error(`Failed to flag order ${orderId} for review in Redis:`, error);
            }
        }
    }
    getReviewReason(order) {
        const reasons = [];
        if (order.specialInstructions) {
            const instructions = order.specialInstructions.toLowerCase();
            const matchedKeywords = OrderValidator_1.OrderValidator.SPECIAL_KEYWORDS.filter(keyword => instructions.includes(keyword.toLowerCase()));
            if (matchedKeywords && matchedKeywords.length > 0) {
                reasons.push(`Special instructions contain keywords: ${matchedKeywords.join(', ')}`);
            }
        }
        if (order.packageDetails && order.packageDetails.length > 0) {
            order.packageDetails.forEach((pkg, index) => {
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
    validateStatusTransition(currentStatus, newStatus) {
        const allowedTransitions = {
            [OrderStatus_1.OrderStatus.PENDING]: [OrderStatus_1.OrderStatus.CONSOLIDATED, OrderStatus_1.OrderStatus.CANCELLED],
            [OrderStatus_1.OrderStatus.CONSOLIDATED]: [OrderStatus_1.OrderStatus.ASSIGNED, OrderStatus_1.OrderStatus.PENDING, OrderStatus_1.OrderStatus.CANCELLED],
            [OrderStatus_1.OrderStatus.ASSIGNED]: [OrderStatus_1.OrderStatus.ROUTED, OrderStatus_1.OrderStatus.CONSOLIDATED, OrderStatus_1.OrderStatus.CANCELLED],
            [OrderStatus_1.OrderStatus.ROUTED]: [OrderStatus_1.OrderStatus.DISPATCHED, OrderStatus_1.OrderStatus.ASSIGNED, OrderStatus_1.OrderStatus.CANCELLED],
            [OrderStatus_1.OrderStatus.DISPATCHED]: [OrderStatus_1.OrderStatus.IN_TRANSIT, OrderStatus_1.OrderStatus.ROUTED, OrderStatus_1.OrderStatus.CANCELLED],
            [OrderStatus_1.OrderStatus.IN_TRANSIT]: [OrderStatus_1.OrderStatus.DELIVERED, OrderStatus_1.OrderStatus.FAILED, OrderStatus_1.OrderStatus.CANCELLED],
            [OrderStatus_1.OrderStatus.DELIVERED]: [],
            [OrderStatus_1.OrderStatus.FAILED]: [OrderStatus_1.OrderStatus.PENDING],
            [OrderStatus_1.OrderStatus.CANCELLED]: [OrderStatus_1.OrderStatus.PENDING]
        };
        if (!allowedTransitions[currentStatus].includes(newStatus) && currentStatus !== newStatus) {
            throw new errorHandler_1.ApiError(400, `Invalid status transition from ${currentStatus} to ${newStatus}`);
        }
    }
}
exports.OrderService = OrderService;
//# sourceMappingURL=OrderService.js.map
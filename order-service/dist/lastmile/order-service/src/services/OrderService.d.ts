import { Order } from '../../../shared/types/entities/Order';
import { OrderStatus } from '../../../shared/types/enums/OrderStatus';
import { OrderRepository } from '../../../shared/database/repositories/OrderRepository';
import { RedisClientType } from 'redis';
export declare class OrderService {
    private orderRepository;
    private redisClient;
    private readonly ORDER_ID_PREFIX;
    private readonly MANUAL_REVIEW_FLAG;
    private readonly ORDER_COUNTER_KEY;
    constructor(orderRepository: OrderRepository, redisClient?: RedisClientType | null);
    createOrder(orderData: Omit<Order, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Order>;
    getOrderById(id: string): Promise<Order>;
    getAllOrders(limit?: number, offset?: number): Promise<Order[]>;
    updateOrder(id: string, updates: Partial<Omit<Order, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Order>;
    deleteOrder(id: string): Promise<boolean>;
    getOrdersByStatus(status: OrderStatus, page?: number, pageSize?: number): Promise<{
        items: Order[];
        pagination: {
            page: number;
            pageSize: number;
            totalItems: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    }>;
    getOrdersByCustomerId(customerId: string): Promise<Order[]>;
    updateOrderStatus(id: string, status: OrderStatus): Promise<Order>;
    getOrdersNeedingReview(): Promise<Order[]>;
    private generateUniqueOrderId;
    private flagOrderForManualReview;
    private getReviewReason;
    private validateStatusTransition;
}
//# sourceMappingURL=OrderService.d.ts.map
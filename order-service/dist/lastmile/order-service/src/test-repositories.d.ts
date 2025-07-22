import { OrderRepository } from '../../shared/database/repositories/OrderRepository';
import { Order } from '../../shared/types/entities/Order';
import { OrderStatus } from '../../shared/types/enums/OrderStatus';
export declare class MockOrderRepository implements Partial<OrderRepository> {
    private orders;
    findById(id: string): Promise<Order | null>;
    findAll(limit?: number, offset?: number): Promise<Order[]>;
    create(entity: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order>;
    update(id: string, updates: Partial<Omit<Order, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Order | null>;
    delete(id: string): Promise<boolean>;
    findByStatus(status: OrderStatus, page?: number, pageSize?: number): Promise<{
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
    findByCustomerId(customerId: string): Promise<Order[]>;
    updateStatus(id: string, status: OrderStatus): Promise<Order | null>;
}
//# sourceMappingURL=test-repositories.d.ts.map
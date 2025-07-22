import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';
import { Order, OrderStatus } from '../../types';
export declare class OrderRepository extends BaseRepository<Order> {
    constructor(pool: Pool);
    mapRowToEntity(row: any): Order;
    mapEntityToRow(entity: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): any;
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
    findAllByStatus(status: OrderStatus): Promise<Order[]>;
    findByCustomerId(customerId: string): Promise<Order[]>;
    updateStatus(id: string, status: OrderStatus): Promise<Order | null>;
    findPendingOrdersInArea(latitude: number, longitude: number, radiusKm?: number, limit?: number): Promise<Order[]>;
    findByDateRange(startDate: Date, endDate: Date, page?: number, pageSize?: number): Promise<{
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
}
//# sourceMappingURL=OrderRepository.d.ts.map
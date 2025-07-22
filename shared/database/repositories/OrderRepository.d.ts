import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';
import { Order, OrderStatus } from '../../types';
export declare class OrderRepository extends BaseRepository<Order> {
    constructor(pool: Pool);
    mapRowToEntity(row: any): Order;
    mapEntityToRow(entity: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): any;
    findByStatus(status: OrderStatus): Promise<Order[]>;
    findByCustomerId(customerId: string): Promise<Order[]>;
    updateStatus(id: string, status: OrderStatus): Promise<Order | null>;
    findPendingOrdersInArea(latitude: number, longitude: number, radiusKm?: number): Promise<Order[]>;
}
//# sourceMappingURL=OrderRepository.d.ts.map
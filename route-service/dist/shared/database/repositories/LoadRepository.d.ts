import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';
import { Load, LoadStatus } from '../../types';
export declare class LoadRepository extends BaseRepository<Load> {
    constructor(pool: Pool);
    mapRowToEntity(row: any): Load;
    mapEntityToRow(entity: Omit<Load, 'id' | 'createdAt' | 'updatedAt'>): any;
    findByStatus(status: LoadStatus): Promise<Load[]>;
    findByVehicleId(vehicleId: string): Promise<Load[]>;
    findByOrderId(orderId: string): Promise<Load | null>;
    updateStatus(id: string, status: LoadStatus): Promise<Load | null>;
    assignVehicle(id: string, vehicleId: string): Promise<Load | null>;
    addOrderToLoad(loadId: string, orderId: string): Promise<Load | null>;
    removeOrderFromLoad(loadId: string, orderId: string): Promise<Load | null>;
    findUnassignedLoads(): Promise<Load[]>;
}
//# sourceMappingURL=LoadRepository.d.ts.map
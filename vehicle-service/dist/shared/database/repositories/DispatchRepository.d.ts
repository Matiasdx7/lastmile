import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';
import { Dispatch, DispatchStatus } from '../../types';
export declare class DispatchRepository extends BaseRepository<Dispatch> {
    constructor(pool: Pool);
    mapRowToEntity(row: any): Dispatch;
    mapEntityToRow(entity: Omit<Dispatch, 'id' | 'createdAt' | 'updatedAt'>): any;
    findByStatus(status: DispatchStatus): Promise<Dispatch[]>;
    findByRouteId(routeId: string): Promise<Dispatch | null>;
    findByVehicleId(vehicleId: string): Promise<Dispatch[]>;
    findByDriverId(driverId: string): Promise<Dispatch[]>;
    updateStatus(id: string, status: DispatchStatus): Promise<Dispatch | null>;
    startDispatch(id: string): Promise<Dispatch | null>;
    completeDispatch(id: string): Promise<Dispatch | null>;
    findActiveDispatches(): Promise<Dispatch[]>;
    findDispatchesInTimeRange(startDate: Date, endDate: Date): Promise<Dispatch[]>;
}
//# sourceMappingURL=DispatchRepository.d.ts.map
import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';
import { Vehicle, VehicleStatus, VehicleType } from '../../types';
export declare class VehicleRepository extends BaseRepository<Vehicle> {
    constructor(pool: Pool);
    mapRowToEntity(row: any): Vehicle;
    mapEntityToRow(entity: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): any;
    findByStatus(status: VehicleStatus, page?: number, pageSize?: number): Promise<{
        items: Vehicle[];
        pagination: {
            page: number;
            pageSize: number;
            totalItems: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    }>;
    findAllByStatus(status: VehicleStatus): Promise<Vehicle[]>;
    findByDriverId(driverId: string): Promise<Vehicle | null>;
    findByLicensePlate(licensePlate: string): Promise<Vehicle | null>;
    updateStatus(id: string, status: VehicleStatus): Promise<Vehicle | null>;
    updateLocation(id: string, latitude: number, longitude: number): Promise<Vehicle | null>;
    findAvailableVehiclesInArea(latitude: number, longitude: number, radiusKm?: number, limit?: number): Promise<Vehicle[]>;
    findByCapacityRequirements(minWeight: number, minVolume: number, status?: VehicleStatus): Promise<Vehicle[]>;
    findByType(type: VehicleType): Promise<Vehicle[]>;
}
//# sourceMappingURL=VehicleRepository.d.ts.map
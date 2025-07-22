import { VehicleRepository } from '../../../shared/database/repositories/VehicleRepository';
import { Vehicle, VehicleStatus } from '../../../shared/types';
import { VehicleValidator } from '../validators/VehicleValidator';
export declare class VehicleService {
    private vehicleRepository;
    private vehicleValidator;
    private readonly CACHE_TTL;
    private readonly VEHICLE_CACHE_PREFIX;
    private readonly AVAILABLE_VEHICLES_CACHE_PREFIX;
    constructor(vehicleRepository: VehicleRepository, vehicleValidator: VehicleValidator);
    findAll(limit?: number, offset?: number): Promise<Vehicle[]>;
    findById(id: string): Promise<Vehicle | null>;
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
    findByLicensePlate(licensePlate: string): Promise<Vehicle | null>;
    findByDriverId(driverId: string): Promise<Vehicle | null>;
    findByType(type: string): Promise<Vehicle[]>;
    create(vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle>;
    update(id: string, updates: Partial<Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Vehicle | null>;
    delete(id: string): Promise<boolean>;
    updateStatus(id: string, status: VehicleStatus): Promise<Vehicle | null>;
    updateLocation(id: string, latitude: number, longitude: number): Promise<Vehicle | null>;
    findAvailableVehiclesInArea(latitude: number, longitude: number, radiusKm?: number): Promise<Vehicle[]>;
}
//# sourceMappingURL=VehicleService.d.ts.map
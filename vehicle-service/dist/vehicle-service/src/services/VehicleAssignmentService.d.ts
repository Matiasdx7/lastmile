import { VehicleRepository } from '../../../shared/database/repositories/VehicleRepository';
import { LoadRepository } from '../../../shared/database/repositories/LoadRepository';
import { Vehicle, VehicleType, Load } from '../../../shared/types';
export interface AssignmentCriteria {
    prioritizeProximity?: boolean;
    maxDistanceKm?: number;
    preferredVehicleType?: VehicleType;
    considerDriverExperience?: boolean;
}
export declare class VehicleAssignmentService {
    private vehicleRepository;
    private loadRepository;
    constructor(vehicleRepository: VehicleRepository, loadRepository: LoadRepository);
    assignVehicleToLoad(loadId: string, criteria?: AssignmentCriteria): Promise<Vehicle | null>;
    private findSuitableVehicles;
    private selectBestVehicle;
    unassignVehicleFromLoad(loadId: string): Promise<boolean>;
    getLoadsForVehicle(vehicleId: string): Promise<Load[]>;
    batchAssignVehiclesToLoads(criteria?: AssignmentCriteria): Promise<{
        successful: {
            loadId: string;
            vehicleId: string;
        }[];
        failed: string[];
    }>;
    checkVehicleCapacityForLoad(vehicleId: string, loadId: string): Promise<boolean>;
}
//# sourceMappingURL=VehicleAssignmentService.d.ts.map
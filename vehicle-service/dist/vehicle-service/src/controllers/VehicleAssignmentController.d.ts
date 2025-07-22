import { Request, Response } from 'express';
import { VehicleAssignmentService } from '../services/VehicleAssignmentService';
export declare class VehicleAssignmentController {
    private vehicleAssignmentService;
    constructor(vehicleAssignmentService: VehicleAssignmentService);
    assignVehicleToLoad: (req: Request, res: Response) => Promise<void>;
    unassignVehicleFromLoad: (req: Request, res: Response) => Promise<void>;
    getLoadsForVehicle: (req: Request, res: Response) => Promise<void>;
    batchAssignVehicles: (req: Request, res: Response) => Promise<void>;
    checkVehicleCapacityForLoad: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=VehicleAssignmentController.d.ts.map
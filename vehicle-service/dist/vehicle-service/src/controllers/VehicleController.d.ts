import { Request, Response } from 'express';
import { VehicleService } from '../services/VehicleService';
export declare class VehicleController {
    private vehicleService;
    constructor(vehicleService: VehicleService);
    getAllVehicles: (req: Request, res: Response) => Promise<void>;
    getVehicleById: (req: Request, res: Response) => Promise<void>;
    createVehicle: (req: Request, res: Response) => Promise<void>;
    updateVehicle: (req: Request, res: Response) => Promise<void>;
    deleteVehicle: (req: Request, res: Response) => Promise<void>;
    updateVehicleStatus: (req: Request, res: Response) => Promise<void>;
    updateVehicleLocation: (req: Request, res: Response) => Promise<void>;
    getVehicleCapacity: (req: Request, res: Response) => Promise<void>;
    findAvailableVehiclesInArea: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=VehicleController.d.ts.map
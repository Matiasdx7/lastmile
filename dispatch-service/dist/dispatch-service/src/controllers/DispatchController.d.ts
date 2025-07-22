import { Request, Response } from 'express';
import { DispatchService } from '../services/DispatchService';
export declare class DispatchController {
    private dispatchService;
    constructor(dispatchService: DispatchService);
    createDispatch(req: Request, res: Response): Promise<void>;
    getDispatch(req: Request, res: Response): Promise<void>;
    getAllDispatches(req: Request, res: Response): Promise<void>;
    getActiveDispatches(req: Request, res: Response): Promise<void>;
    confirmDispatch(req: Request, res: Response): Promise<void>;
    getRouteSummary(req: Request, res: Response): Promise<void>;
    sendRouteToDriver(req: Request, res: Response): Promise<void>;
    getDetailedRouteSummary(req: Request, res: Response): Promise<void>;
    confirmDispatchAndSendRoute(req: Request, res: Response): Promise<void>;
    updateDispatchStatus(req: Request, res: Response): Promise<void>;
    updateVehicleLocation(req: Request, res: Response): Promise<void>;
    getDispatchLocation(req: Request, res: Response): Promise<void>;
    sendCriticalNotification(req: Request, res: Response): Promise<void>;
    detectAndNotifyDelays(req: Request, res: Response): Promise<void>;
    recordDeliverySuccess(req: Request, res: Response): Promise<void>;
    recordDeliveryFailure(req: Request, res: Response): Promise<void>;
    checkRouteCompletion(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=DispatchController.d.ts.map
import { Request, Response } from 'express';
import { Pool } from 'pg';
export declare class RouteController {
    private routeService;
    constructor(pool: Pool);
    createRoute(req: Request, res: Response): Promise<void>;
    getRoute(req: Request, res: Response): Promise<void>;
    getRoutes(req: Request, res: Response): Promise<void>;
    updateRouteStops(req: Request, res: Response): Promise<void>;
    updateRouteStatus(req: Request, res: Response): Promise<void>;
    geocodeAddress(req: Request, res: Response): Promise<void>;
    calculateDistance(req: Request, res: Response): Promise<void>;
    generateDirections(req: Request, res: Response): Promise<void>;
    calculateTravelTimes(req: Request, res: Response): Promise<void>;
    getRouteMapData(req: Request, res: Response): Promise<void>;
    reorderRouteStops(req: Request, res: Response): Promise<void>;
    getTimeWindowConflicts(req: Request, res: Response): Promise<void>;
}
export default RouteController;
//# sourceMappingURL=RouteController.d.ts.map
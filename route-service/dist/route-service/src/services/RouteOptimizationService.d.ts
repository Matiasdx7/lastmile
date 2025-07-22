import { Order, Vehicle, Route } from '../../../shared/types';
import { MapService } from './MapService';
export declare class RouteOptimizationService {
    private mapService;
    constructor(mapService: MapService);
    optimizeRoutes(orders: Order[], vehicles: Vehicle[], depotLocation: {
        latitude: number;
        longitude: number;
    }): Promise<Route[]>;
    private setupVRPProblem;
    private solveVRP;
    private clarkeWrightSavings;
    private convertSolutionToRoutes;
    validateRouteTimeWindows(route: Route, orders: Order[]): Promise<string[]>;
    private calculateEstimatedArrivalTimes;
    generateTurnByTurnDirections(route: Route): Promise<any>;
    suggestAlternativeRoutes(route: Route, orders: Order[], vehicles: Vehicle[]): Promise<Route[]>;
    private calculateTotalWeight;
    private estimateServiceTime;
    private calculateRouteDistance;
    private calculateRouteDuration;
}
//# sourceMappingURL=RouteOptimizationService.d.ts.map
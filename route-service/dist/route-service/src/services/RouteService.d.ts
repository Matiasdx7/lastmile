import { Pool } from 'pg';
import { Route, RouteStop, RouteStatus } from '../../../shared/types';
import { DirectionStep } from './MapsService';
import { Location } from '../../../shared/types/common/Location';
import { Address } from '../../../shared/types/common/Address';
export declare class RouteService {
    private routeRepository;
    private readonly CACHE_TTL;
    private readonly ROUTE_CACHE_PREFIX;
    private readonly ROUTE_MAP_CACHE_PREFIX;
    private readonly TURN_BY_TURN_CACHE_PREFIX;
    constructor(pool: Pool);
    createRoute(loadId: string, vehicleId: string, stops: RouteStop[]): Promise<Route>;
    getRouteById(id: string): Promise<Route | null>;
    getAllRoutes(): Promise<Route[]>;
    getRoutesByStatus(status: RouteStatus): Promise<Route[]>;
    getRouteByLoadId(loadId: string): Promise<Route | null>;
    getRoutesByVehicleId(vehicleId: string): Promise<Route[]>;
    updateRouteStops(id: string, stops: RouteStop[]): Promise<Route | null>;
    updateRouteStatus(id: string, status: RouteStatus): Promise<Route | null>;
    geocodeAddress(address: Address): Promise<Location>;
    calculateDistance(origin: Location, destination: Location): Promise<{
        distance: number;
        duration: number;
    }>;
    generateTurnByTurnDirections(routeId: string): Promise<DirectionStep[][]>;
    calculateEstimatedTravelTimes(routeId: string, startTime?: Date): Promise<Route | null>;
    recalculateArrivalTimes(routeId: string, startTime?: Date): Promise<Route | null>;
    generateRouteMapData(routeId: string): Promise<{
        polyline: string;
        waypoints: Array<{
            location: Location;
            orderId: string;
            sequence: number;
            estimatedArrival: Date;
        }>;
    }>;
    reorderRouteStops(routeId: string, stopOrder: string[]): Promise<Route | null>;
    validateTimeWindows(routeId: string, orders: any[]): Promise<string[] | null>;
    detectTimeWindowConflicts(routeOrId: string | Route, orders: any[]): Promise<string[] | null>;
    optimizeRouteSequence(routeId: string, orders: any[]): Promise<Route | null>;
    private findOptimalSequence;
    private invalidateRouteCaches;
}
export default RouteService;
//# sourceMappingURL=RouteService.d.ts.map
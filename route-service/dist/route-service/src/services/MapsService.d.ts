import { Address } from '../../../shared/types/common/Address';
import { Location } from '../../../shared/types/common/Location';
import { RouteStop } from '../../../shared/types/entities/Route';
export interface DirectionsResult {
    distance: number;
    duration: number;
    polyline: string;
    steps: DirectionStep[];
}
export interface DirectionStep {
    distance: number;
    duration: number;
    instructions: string;
    polyline: string;
    startLocation: Location;
    endLocation: Location;
}
export interface DistanceMatrixResult {
    origins: Location[];
    destinations: Location[];
    distances: number[][];
    durations: number[][];
}
export declare class MapsService {
    private client;
    private apiKey;
    private readonly CACHE_TTL;
    private readonly GEOCODE_CACHE_PREFIX;
    private readonly DIRECTIONS_CACHE_PREFIX;
    private readonly DISTANCE_MATRIX_CACHE_PREFIX;
    constructor();
    geocodeAddress(address: Address): Promise<Location>;
    getDirections(origin: Location, destination: Location, waypoints?: Location[]): Promise<DirectionsResult>;
    getDistanceMatrix(origins: Location[], destinations: Location[]): Promise<DistanceMatrixResult>;
    calculateEstimatedTravelTimes(stops: RouteStop[], startTime?: Date): Promise<RouteStop[]>;
    calculateRouteMetrics(stops: RouteStop[]): Promise<{
        totalDistance: number;
        estimatedDuration: number;
    }>;
    generateTurnByTurnDirections(stops: RouteStop[]): Promise<DirectionStep[][]>;
    invalidateRouteCaches(): Promise<void>;
}
declare const _default: MapsService;
export default _default;
//# sourceMappingURL=MapsService.d.ts.map
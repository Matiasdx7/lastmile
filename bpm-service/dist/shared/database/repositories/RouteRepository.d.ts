import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';
import { Route, RouteStatus } from '../../types';
export declare class RouteRepository extends BaseRepository<Route> {
    constructor(pool: Pool);
    mapRowToEntity(row: any): Route;
    mapEntityToRow(entity: Omit<Route, 'id' | 'createdAt' | 'updatedAt'>): any;
    findByStatus(status: RouteStatus): Promise<Route[]>;
    findByLoadId(loadId: string): Promise<Route | null>;
    findByVehicleId(vehicleId: string): Promise<Route[]>;
    updateStatus(id: string, status: RouteStatus): Promise<Route | null>;
    updateStops(id: string, stops: any[]): Promise<Route | null>;
    updateRouteMetrics(id: string, totalDistance: number, estimatedDuration: number): Promise<Route | null>;
    findActiveRoutes(): Promise<Route[]>;
    findRoutesForOptimization(): Promise<Route[]>;
}
//# sourceMappingURL=RouteRepository.d.ts.map
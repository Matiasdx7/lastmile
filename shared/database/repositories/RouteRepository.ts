import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';
import { Route, RouteStatus } from '../../types';

export class RouteRepository extends BaseRepository<Route> {
  constructor(pool: Pool) {
    super(pool, 'routes');
  }

  mapRowToEntity(row: any): Route {
    return {
      id: row.id,
      loadId: row.load_id,
      vehicleId: row.vehicle_id,
      stops: row.stops,
      totalDistance: parseFloat(row.total_distance),
      estimatedDuration: parseInt(row.estimated_duration),
      status: row.status as RouteStatus,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  mapEntityToRow(entity: Omit<Route, 'id' | 'createdAt' | 'updatedAt'>): any {
    return {
      load_id: entity.loadId,
      vehicle_id: entity.vehicleId,
      stops: JSON.stringify(entity.stops),
      total_distance: entity.totalDistance,
      estimated_duration: entity.estimatedDuration,
      status: entity.status
    };
  }

  async findByStatus(status: RouteStatus): Promise<Route[]> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE status = $1 ORDER BY created_at DESC`,
      [status]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  async findByLoadId(loadId: string): Promise<Route | null> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE load_id = $1`,
      [loadId]
    );
    return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
  }

  async findByVehicleId(vehicleId: string): Promise<Route[]> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE vehicle_id = $1 ORDER BY created_at DESC`,
      [vehicleId]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  async updateStatus(id: string, status: RouteStatus): Promise<Route | null> {
    return this.update(id, { status } as any);
  }

  async updateStops(id: string, stops: any[]): Promise<Route | null> {
    return this.update(id, { stops } as any);
  }

  async updateRouteMetrics(id: string, totalDistance: number, estimatedDuration: number): Promise<Route | null> {
    return this.update(id, { 
      totalDistance, 
      estimatedDuration 
    } as any);
  }

  async findActiveRoutes(): Promise<Route[]> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE status IN ('dispatched', 'in_progress') ORDER BY created_at ASC`
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  async findRoutesForOptimization(): Promise<Route[]> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE status = 'planned' ORDER BY created_at ASC`
    );
    return rows.map(row => this.mapRowToEntity(row));
  }
}
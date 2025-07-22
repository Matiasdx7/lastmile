import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';
import { Dispatch, DispatchStatus } from '../../types';

export class DispatchRepository extends BaseRepository<Dispatch> {
  constructor(pool: Pool) {
    super(pool, 'dispatches');
  }

  mapRowToEntity(row: any): Dispatch {
    return {
      id: row.id,
      routeId: row.route_id,
      vehicleId: row.vehicle_id,
      driverId: row.driver_id,
      status: row.status as DispatchStatus,
      startTime: row.start_time ? new Date(row.start_time) : undefined,
      completedTime: row.completed_time ? new Date(row.completed_time) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  mapEntityToRow(entity: Omit<Dispatch, 'id' | 'createdAt' | 'updatedAt'>): any {
    return {
      route_id: entity.routeId,
      vehicle_id: entity.vehicleId,
      driver_id: entity.driverId,
      status: entity.status,
      start_time: entity.startTime,
      completed_time: entity.completedTime
    };
  }

  async findByStatus(status: DispatchStatus): Promise<Dispatch[]> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE status = $1 ORDER BY created_at DESC`,
      [status]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  async findByRouteId(routeId: string): Promise<Dispatch | null> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE route_id = $1`,
      [routeId]
    );
    return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
  }

  async findByVehicleId(vehicleId: string): Promise<Dispatch[]> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE vehicle_id = $1 ORDER BY created_at DESC`,
      [vehicleId]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  async findByDriverId(driverId: string): Promise<Dispatch[]> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE driver_id = $1 ORDER BY created_at DESC`,
      [driverId]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  async updateStatus(id: string, status: DispatchStatus): Promise<Dispatch | null> {
    return this.update(id, { status } as any);
  }

  async startDispatch(id: string): Promise<Dispatch | null> {
    return this.update(id, { 
      status: DispatchStatus.ACTIVE,
      startTime: new Date()
    } as any);
  }

  async completeDispatch(id: string): Promise<Dispatch | null> {
    return this.update(id, { 
      status: DispatchStatus.COMPLETED,
      completedTime: new Date()
    } as any);
  }

  async findActiveDispatches(): Promise<Dispatch[]> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE status = 'active' ORDER BY start_time ASC`
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  async findDispatchesInTimeRange(startDate: Date, endDate: Date): Promise<Dispatch[]> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.tableName} 
       WHERE created_at >= $1 AND created_at <= $2 
       ORDER BY created_at DESC`,
      [startDate, endDate]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }
}
import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';
import { Load, LoadStatus } from '../../types';

export class LoadRepository extends BaseRepository<Load> {
  constructor(pool: Pool) {
    super(pool, 'loads');
  }

  mapRowToEntity(row: any): Load {
    return {
      id: row.id,
      orders: row.order_ids,
      vehicleId: row.vehicle_id,
      totalWeight: parseFloat(row.total_weight),
      totalVolume: parseFloat(row.total_volume),
      status: row.status as LoadStatus,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  mapEntityToRow(entity: Omit<Load, 'id' | 'createdAt' | 'updatedAt'>): any {
    return {
      order_ids: entity.orders,
      vehicle_id: entity.vehicleId,
      total_weight: entity.totalWeight,
      total_volume: entity.totalVolume,
      status: entity.status
    };
  }

  async findByStatus(status: LoadStatus): Promise<Load[]> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE status = $1 ORDER BY created_at DESC`,
      [status]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  async findByVehicleId(vehicleId: string): Promise<Load[]> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE vehicle_id = $1 ORDER BY created_at DESC`,
      [vehicleId]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  async findByOrderId(orderId: string): Promise<Load | null> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE $1 = ANY(order_ids)`,
      [orderId]
    );
    return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
  }

  async updateStatus(id: string, status: LoadStatus): Promise<Load | null> {
    return this.update(id, { status } as any);
  }

  async assignVehicle(id: string, vehicleId: string): Promise<Load | null> {
    return this.update(id, { vehicleId } as any);
  }

  async addOrderToLoad(loadId: string, orderId: string): Promise<Load | null> {
    const query = `
      UPDATE ${this.tableName}
      SET order_ids = array_append(order_ids, $2)
      WHERE id = $1 AND NOT ($2 = ANY(order_ids))
      RETURNING *
    `;
    
    const rows = await this.executeQuery(query, [loadId, orderId]);
    return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
  }

  async removeOrderFromLoad(loadId: string, orderId: string): Promise<Load | null> {
    const query = `
      UPDATE ${this.tableName}
      SET order_ids = array_remove(order_ids, $2)
      WHERE id = $1
      RETURNING *
    `;
    
    const rows = await this.executeQuery(query, [loadId, orderId]);
    return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
  }

  async findUnassignedLoads(): Promise<Load[]> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE vehicle_id IS NULL AND status = 'consolidated' ORDER BY created_at ASC`
    );
    return rows.map(row => this.mapRowToEntity(row));
  }
}
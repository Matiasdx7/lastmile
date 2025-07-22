import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';
import { Vehicle, VehicleStatus, VehicleType } from '../../types';

export class VehicleRepository extends BaseRepository<Vehicle> {
  constructor(pool: Pool) {
    super(pool, 'vehicles');
  }

  mapRowToEntity(row: any): Vehicle {
    return {
      id: row.id,
      licensePlate: row.license_plate,
      type: row.type as VehicleType,
      capacity: row.capacity,
      currentLocation: row.current_location,
      status: row.status as VehicleStatus,
      driverId: row.driver_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  mapEntityToRow(entity: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): any {
    return {
      license_plate: entity.licensePlate,
      type: entity.type,
      capacity: JSON.stringify(entity.capacity),
      current_location: entity.currentLocation ? JSON.stringify(entity.currentLocation) : null,
      status: entity.status,
      driver_id: entity.driverId
    };
  }

  /**
   * Find vehicles by status with pagination
   * @param status Vehicle status to filter by
   * @param page Page number (1-based)
   * @param pageSize Number of items per page
   * @returns Paginated vehicles with metadata
   */
  async findByStatus(
    status: VehicleStatus,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    items: Vehicle[];
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    }
  }> {
    // Ensure valid pagination parameters
    const validPage = Math.max(1, page);
    const validPageSize = Math.max(1, Math.min(100, pageSize));
    const offset = (validPage - 1) * validPageSize;
    
    // Get total count for pagination metadata
    const countResult = await this.executeQuery(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE status = $1`,
      [status]
    );
    const totalItems = parseInt(countResult[0].count, 10);
    const totalPages = Math.ceil(totalItems / validPageSize);
    
    // Get items for current page
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [status, validPageSize, offset]
    );
    
    const items = rows.map(row => this.mapRowToEntity(row));
    
    return {
      items,
      pagination: {
        page: validPage,
        pageSize: validPageSize,
        totalItems,
        totalPages,
        hasNextPage: validPage < totalPages,
        hasPrevPage: validPage > 1
      }
    };
  }
  
  /**
   * Find all vehicles by status without pagination (for internal use)
   * @param status Vehicle status to filter by
   * @returns Array of vehicles
   */
  async findAllByStatus(status: VehicleStatus): Promise<Vehicle[]> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE status = $1 ORDER BY created_at DESC`,
      [status]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  async findByDriverId(driverId: string): Promise<Vehicle | null> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE driver_id = $1`,
      [driverId]
    );
    return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
  }

  async findByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE license_plate = $1`,
      [licensePlate]
    );
    return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
  }

  async updateStatus(id: string, status: VehicleStatus): Promise<Vehicle | null> {
    return this.update(id, { status } as any);
  }

  async updateLocation(id: string, latitude: number, longitude: number): Promise<Vehicle | null> {
    return this.update(id, { 
      currentLocation: { latitude, longitude } 
    } as any);
  }

  /**
   * Find available vehicles in a geographic area with optimized query
   * @param latitude Center latitude
   * @param longitude Center longitude
   * @param radiusKm Radius in kilometers
   * @param limit Maximum number of vehicles to return
   * @returns Array of vehicles
   */
  async findAvailableVehiclesInArea(
    latitude: number, 
    longitude: number, 
    radiusKm: number = 50,
    limit: number = 100
  ): Promise<Vehicle[]> {
    // Use a more efficient query with index support
    // This query uses the partial index on available vehicles and the GIN index on location
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE status = 'available'
      AND current_location IS NOT NULL
      AND (
        6371 * acos(
          cos(radians($1)) * cos(radians((current_location->>'latitude')::float))
          * cos(radians((current_location->>'longitude')::float) - radians($2))
          + sin(radians($1)) * sin(radians((current_location->>'latitude')::float))
        )
      ) <= $3
      ORDER BY (
        6371 * acos(
          cos(radians($1)) * cos(radians((current_location->>'latitude')::float))
          * cos(radians((current_location->>'longitude')::float) - radians($2))
          + sin(radians($1)) * sin(radians((current_location->>'latitude')::float))
        )
      ) ASC
      LIMIT $4
    `;
    
    const rows = await this.executeQuery(query, [latitude, longitude, radiusKm, limit]);
    return rows.map(row => this.mapRowToEntity(row));
  }
  
  /**
   * Find vehicles by capacity requirements
   * @param minWeight Minimum weight capacity required
   * @param minVolume Minimum volume capacity required
   * @param status Optional status filter
   * @returns Array of vehicles meeting the capacity requirements
   */
  async findByCapacityRequirements(
    minWeight: number,
    minVolume: number,
    status?: VehicleStatus
  ): Promise<Vehicle[]> {
    let query = `
      SELECT * FROM ${this.tableName}
      WHERE (capacity->>'maxWeight')::float >= $1
      AND (capacity->>'maxVolume')::float >= $2
    `;
    
    const params = [minWeight, minVolume];
    
    if (status) {
      query += ` AND status = $3`;
      params.push(status as any);
    }
    
    query += ` ORDER BY (capacity->>'maxWeight')::float ASC`;
    
    const rows = await this.executeQuery(query, params);
    return rows.map(row => this.mapRowToEntity(row));
  }

  async findByType(type: VehicleType): Promise<Vehicle[]> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE type = $1 ORDER BY created_at DESC`,
      [type]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }
}
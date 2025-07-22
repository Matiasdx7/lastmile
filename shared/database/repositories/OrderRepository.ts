import { Pool } from 'pg';
import { BaseRepository } from './BaseRepository';
import { Order, OrderStatus } from '../../types';

export class OrderRepository extends BaseRepository<Order> {
  constructor(pool: Pool) {
    super(pool, 'orders');
  }

  mapRowToEntity(row: any): Order {
    return {
      id: row.id,
      customerId: row.customer_id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      deliveryAddress: row.delivery_address,
      packageDetails: row.package_details,
      specialInstructions: row.special_instructions,
      timeWindow: row.time_window,
      status: row.status as OrderStatus,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  mapEntityToRow(entity: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): any {
    return {
      customer_id: entity.customerId,
      customer_name: entity.customerName,
      customer_phone: entity.customerPhone,
      delivery_address: JSON.stringify(entity.deliveryAddress),
      package_details: JSON.stringify(entity.packageDetails),
      special_instructions: entity.specialInstructions,
      time_window: entity.timeWindow ? JSON.stringify(entity.timeWindow) : null,
      status: entity.status
    };
  }

  /**
   * Find orders by status with pagination
   * @param status Order status to filter by
   * @param page Page number (1-based)
   * @param pageSize Number of items per page
   * @returns Paginated orders with metadata
   */
  async findByStatus(
    status: OrderStatus,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    items: Order[];
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
   * Find orders by status without pagination (for internal use)
   * @param status Order status to filter by
   * @returns Array of orders
   */
  async findAllByStatus(status: OrderStatus): Promise<Order[]> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE status = $1 ORDER BY created_at DESC`,
      [status]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.tableName} WHERE customer_id = $1 ORDER BY created_at DESC`,
      [customerId]
    );
    return rows.map(row => this.mapRowToEntity(row));
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    return this.update(id, { status } as any);
  }

  /**
   * Find pending orders in a geographic area with optimized query
   * @param latitude Center latitude
   * @param longitude Center longitude
   * @param radiusKm Radius in kilometers
   * @param limit Maximum number of orders to return
   * @returns Array of orders
   */
  async findPendingOrdersInArea(
    latitude: number, 
    longitude: number, 
    radiusKm: number = 10,
    limit: number = 100
  ): Promise<Order[]> {
    // Use a more efficient query with index support
    // This query uses the partial index on pending orders and the GIN index on coordinates
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE status = 'pending'
      AND (
        6371 * acos(
          cos(radians($1)) * cos(radians((delivery_address->'coordinates'->>'latitude')::float))
          * cos(radians((delivery_address->'coordinates'->>'longitude')::float) - radians($2))
          + sin(radians($1)) * sin(radians((delivery_address->'coordinates'->>'latitude')::float))
        )
      ) <= $3
      ORDER BY created_at ASC
      LIMIT $4
    `;
    
    const rows = await this.executeQuery(query, [latitude, longitude, radiusKm, limit]);
    return rows.map(row => this.mapRowToEntity(row));
  }
  
  /**
   * Find orders by date range with pagination
   * @param startDate Start date
   * @param endDate End date
   * @param page Page number
   * @param pageSize Page size
   * @returns Paginated orders with metadata
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    items: Order[];
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
      `SELECT COUNT(*) as count FROM ${this.tableName} 
       WHERE created_at >= $1 AND created_at <= $2`,
      [startDate, endDate]
    );
    const totalItems = parseInt(countResult[0].count, 10);
    const totalPages = Math.ceil(totalItems / validPageSize);
    
    // Get items for current page
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.tableName} 
       WHERE created_at >= $1 AND created_at <= $2 
       ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [startDate, endDate, validPageSize, offset]
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
}
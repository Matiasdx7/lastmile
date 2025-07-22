import { Pool, PoolClient } from 'pg';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Repository<T extends BaseEntity> {
  findById(id: string): Promise<T | null>;
  findAll(limit?: number, offset?: number): Promise<T[]>;
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, updates: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

export abstract class BaseRepository<T extends BaseEntity> implements Repository<T> {
  protected pool: Pool;
  protected tableName: string;

  constructor(pool: Pool, tableName: string) {
    this.pool = pool;
    this.tableName = tableName;
  }

  abstract mapRowToEntity(row: any): T;
  abstract mapEntityToRow(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): any;

  async findById(id: string): Promise<T | null> {
    const client = await this.pool.connect();
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToEntity(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      const query = `SELECT * FROM ${this.tableName} ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
      const result = await client.query(query, [limit, offset]);
      
      return result.rows.map(row => this.mapRowToEntity(row));
    } finally {
      client.release();
    }
  }
  
  /**
   * Count total number of records in the table
   * @returns Total count of records
   */
  async count(): Promise<number> {
    const client = await this.pool.connect();
    try {
      const query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      const result = await client.query(query);
      return parseInt(result.rows[0].count, 10);
    } finally {
      client.release();
    }
  }
  
  /**
   * Find all entities with pagination metadata
   * @param page Page number (1-based)
   * @param pageSize Number of items per page
   * @returns Object with items and pagination metadata
   */
  async findAllPaginated(page: number = 1, pageSize: number = 20): Promise<{
    items: T[];
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
    const validPageSize = Math.max(1, Math.min(100, pageSize)); // Limit page size to prevent excessive queries
    const offset = (validPage - 1) * validPageSize;
    
    // Get total count for pagination metadata
    const totalItems = await this.count();
    const totalPages = Math.ceil(totalItems / validPageSize);
    
    // Get items for current page
    const items = await this.findAll(validPageSize, offset);
    
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

  async create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const client = await this.pool.connect();
    try {
      const row = this.mapEntityToRow(entity);
      const columns = Object.keys(row);
      const values = Object.values(row);
      const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
      
      const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const result = await client.query(query, values);
      return this.mapRowToEntity(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async update(id: string, updates: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T | null> {
    const client = await this.pool.connect();
    try {
      const row = this.mapEntityToRow(updates as any);
      const columns = Object.keys(row);
      const values = Object.values(row);
      
      if (columns.length === 0) {
        return this.findById(id);
      }
      
      const setClause = columns.map((col, index) => `${col} = $${index + 2}`).join(', ');
      const query = `
        UPDATE ${this.tableName}
        SET ${setClause}
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await client.query(query, [id, ...values]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToEntity(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
      const result = await client.query(query, [id]);
      
      return result.rowCount !== null && result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  protected async executeQuery(query: string, params: any[] = []): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }
}
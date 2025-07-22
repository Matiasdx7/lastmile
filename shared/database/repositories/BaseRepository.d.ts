import { Pool } from 'pg';
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
export declare abstract class BaseRepository<T extends BaseEntity> implements Repository<T> {
    protected pool: Pool;
    protected tableName: string;
    constructor(pool: Pool, tableName: string);
    abstract mapRowToEntity(row: any): T;
    abstract mapEntityToRow(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): any;
    findById(id: string): Promise<T | null>;
    findAll(limit?: number, offset?: number): Promise<T[]>;
    create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
    update(id: string, updates: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T | null>;
    delete(id: string): Promise<boolean>;
    protected executeQuery(query: string, params?: any[]): Promise<any[]>;
}
//# sourceMappingURL=BaseRepository.d.ts.map
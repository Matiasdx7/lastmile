import { Pool } from 'pg';
import { RedisClientType } from 'redis';
export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    maxConnections?: number;
}
export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    database?: number;
}
export declare class DatabaseConnection {
    private static instance;
    private pool;
    private redisClient;
    private constructor();
    static getInstance(): DatabaseConnection;
    initializePostgreSQL(config: DatabaseConfig): Promise<Pool>;
    initializeRedis(config: RedisConfig): Promise<RedisClientType>;
    getPostgreSQLPool(): Pool;
    getRedisClient(): RedisClientType;
    closeConnections(): Promise<void>;
}
export declare function getDatabaseConfigFromEnv(): DatabaseConfig;
export declare function getRedisConfigFromEnv(): RedisConfig;
//# sourceMappingURL=connection.d.ts.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConnection = void 0;
exports.getDatabaseConfigFromEnv = getDatabaseConfigFromEnv;
exports.getRedisConfigFromEnv = getRedisConfigFromEnv;
const pg_1 = require("pg");
const redis_1 = require("redis");
class DatabaseConnection {
    constructor() {
        this.pool = null;
        this.redisClient = null;
    }
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    async initializePostgreSQL(config) {
        if (this.pool) {
            return this.pool;
        }
        const poolConfig = {
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.username,
            password: config.password,
            max: config.maxConnections || 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        };
        if (config.ssl) {
            poolConfig.ssl = { rejectUnauthorized: false };
        }
        this.pool = new pg_1.Pool(poolConfig);
        try {
            const client = await this.pool.connect();
            console.log('PostgreSQL connection established successfully');
            client.release();
        }
        catch (error) {
            console.error('Failed to connect to PostgreSQL:', error);
            throw error;
        }
        return this.pool;
    }
    async initializeRedis(config) {
        if (this.redisClient) {
            return this.redisClient;
        }
        const redisUrl = `redis://${config.password ? `:${config.password}@` : ''}${config.host}:${config.port}/${config.database || 0}`;
        this.redisClient = (0, redis_1.createClient)({
            url: redisUrl
        });
        this.redisClient.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });
        this.redisClient.on('connect', () => {
            console.log('Redis connection established successfully');
        });
        await this.redisClient.connect();
        return this.redisClient;
    }
    getPostgreSQLPool() {
        if (!this.pool) {
            throw new Error('PostgreSQL connection not initialized. Call initializePostgreSQL first.');
        }
        return this.pool;
    }
    getRedisClient() {
        if (!this.redisClient) {
            throw new Error('Redis connection not initialized. Call initializeRedis first.');
        }
        return this.redisClient;
    }
    async closeConnections() {
        const promises = [];
        if (this.pool) {
            promises.push(this.pool.end());
            this.pool = null;
        }
        if (this.redisClient) {
            promises.push(this.redisClient.quit().then(() => { }));
            this.redisClient = null;
        }
        await Promise.all(promises);
        console.log('All database connections closed');
    }
}
exports.DatabaseConnection = DatabaseConnection;
function getDatabaseConfigFromEnv() {
    return {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'last_mile_delivery',
        username: process.env.DB_USER || 'delivery_app',
        password: process.env.DB_PASSWORD || 'delivery_password',
        ssl: process.env.DB_SSL === 'true',
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20')
    };
}
function getRedisConfigFromEnv() {
    return {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        database: parseInt(process.env.REDIS_DB || '0')
    };
}
//# sourceMappingURL=connection.js.map
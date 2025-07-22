"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const redis_1 = require("redis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class RedisService {
    constructor() {
        this.isConnected = false;
        this.client = (0, redis_1.createClient)({
            url: `redis://${process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : ''}${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
        });
        this.client.on('error', (err) => {
            console.error('Redis Client Error', err);
            this.isConnected = false;
        });
        this.client.on('connect', () => {
            this.isConnected = true;
            console.log('Connected to Redis');
        });
        this.connect();
    }
    async connect() {
        if (!this.isConnected) {
            try {
                await this.client.connect();
            }
            catch (error) {
                console.error('Failed to connect to Redis', error);
            }
        }
    }
    async get(key) {
        try {
            if (!this.isConnected)
                await this.connect();
            return await this.client.get(key);
        }
        catch (error) {
            console.error('Redis get error', error);
            return null;
        }
    }
    async getJson(key) {
        try {
            const data = await this.get(key);
            if (data) {
                return JSON.parse(data);
            }
            return null;
        }
        catch (error) {
            console.error('Redis getJson error', error);
            return null;
        }
    }
    async set(key, value, ttl) {
        try {
            if (!this.isConnected)
                await this.connect();
            if (ttl) {
                await this.client.set(key, value, { EX: ttl });
            }
            else {
                await this.client.set(key, value);
            }
        }
        catch (error) {
            console.error('Redis set error', error);
        }
    }
    async setJson(key, value, ttl) {
        try {
            await this.set(key, JSON.stringify(value), ttl);
        }
        catch (error) {
            console.error('Redis setJson error', error);
        }
    }
    async del(key) {
        try {
            if (!this.isConnected)
                await this.connect();
            await this.client.del(key);
        }
        catch (error) {
            console.error('Redis del error', error);
        }
    }
    async keys(pattern) {
        try {
            if (!this.isConnected)
                await this.connect();
            return await this.client.keys(pattern);
        }
        catch (error) {
            console.error('Redis keys error', error);
            return [];
        }
    }
    async invalidatePattern(pattern) {
        try {
            const keys = await this.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
            }
        }
        catch (error) {
            console.error('Redis invalidatePattern error', error);
        }
    }
    async disconnect() {
        if (this.isConnected) {
            await this.client.disconnect();
            this.isConnected = false;
        }
    }
}
exports.RedisService = RedisService;
exports.default = new RedisService();
//# sourceMappingURL=RedisService.js.map
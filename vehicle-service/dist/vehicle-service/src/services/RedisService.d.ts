export declare class RedisService {
    private client;
    private isConnected;
    constructor();
    private connect;
    get(key: string): Promise<string | null>;
    getJson<T>(key: string): Promise<T | null>;
    set(key: string, value: string, ttl?: number): Promise<void>;
    setJson<T>(key: string, value: T, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    keys(pattern: string): Promise<string[]>;
    invalidatePattern(pattern: string): Promise<void>;
    disconnect(): Promise<void>;
}
declare const _default: RedisService;
export default _default;
//# sourceMappingURL=RedisService.d.ts.map
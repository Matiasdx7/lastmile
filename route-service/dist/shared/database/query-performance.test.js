"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const perf_hooks_1 = require("perf_hooks");
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL
});
describe('Database Query Performance Tests', () => {
    afterAll(async () => {
        await pool.end();
    });
    async function measureQueryTime(query, params = []) {
        const client = await pool.connect();
        try {
            const start = perf_hooks_1.performance.now();
            await client.query(query, params);
            const end = perf_hooks_1.performance.now();
            return end - start;
        }
        finally {
            client.release();
        }
    }
    async function explainQuery(query, params = []) {
        const client = await pool.connect();
        try {
            const result = await client.query(`EXPLAIN ANALYZE ${query}`, params);
            return result.rows.map((row) => row['QUERY PLAN']).join('\n');
        }
        finally {
            client.release();
        }
    }
    it('should efficiently query orders by status with index', async () => {
        const query = `
      SELECT * FROM orders 
      WHERE status = $1 
      ORDER BY created_at DESC 
      LIMIT 20
    `;
        const explainResult = await explainQuery(query, ['pending']);
        console.log('EXPLAIN ANALYZE for orders by status query:');
        console.log(explainResult);
        const iterations = 10;
        let totalTime = 0;
        for (let i = 0; i < iterations; i++) {
            const time = await measureQueryTime(query, ['pending']);
            totalTime += time;
        }
        const avgTime = totalTime / iterations;
        console.log(`Average execution time for orders by status query: ${avgTime.toFixed(2)}ms`);
        expect(avgTime).toBeLessThan(100);
        expect(explainResult.toLowerCase()).toContain('index');
    }, 10000);
    it('should efficiently query vehicles in area with spatial index', async () => {
        const query = `
      SELECT * FROM vehicles
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
      LIMIT 20
    `;
        const params = [40.7128, -74.006, 50];
        const explainResult = await explainQuery(query, params);
        console.log('EXPLAIN ANALYZE for vehicles in area query:');
        console.log(explainResult);
        const iterations = 10;
        let totalTime = 0;
        for (let i = 0; i < iterations; i++) {
            const time = await measureQueryTime(query, params);
            totalTime += time;
        }
        const avgTime = totalTime / iterations;
        console.log(`Average execution time for vehicles in area query: ${avgTime.toFixed(2)}ms`);
        expect(avgTime).toBeLessThan(200);
    }, 10000);
    it('should efficiently query orders with pagination', async () => {
        const pageSizes = [10, 20, 50, 100];
        for (const pageSize of pageSizes) {
            const query = `
        SELECT * FROM orders 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `;
            const params = [pageSize, 0];
            const explainResult = await explainQuery(query, params);
            console.log(`EXPLAIN ANALYZE for orders pagination (pageSize=${pageSize}):`);
            console.log(explainResult);
            const iterations = 5;
            let totalTime = 0;
            for (let i = 0; i < iterations; i++) {
                const time = await measureQueryTime(query, params);
                totalTime += time;
            }
            const avgTime = totalTime / iterations;
            console.log(`Average execution time for orders pagination (pageSize=${pageSize}): ${avgTime.toFixed(2)}ms`);
            const maxTime = 50 + (pageSize / 2);
            expect(avgTime).toBeLessThan(maxTime);
        }
    }, 20000);
    it('should efficiently query orders by date range', async () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const endDate = new Date();
        const query = `
      SELECT * FROM orders 
      WHERE created_at >= $1 AND created_at <= $2 
      ORDER BY created_at DESC 
      LIMIT 20
    `;
        const params = [startDate, endDate];
        const explainResult = await explainQuery(query, params);
        console.log('EXPLAIN ANALYZE for orders by date range query:');
        console.log(explainResult);
        const iterations = 10;
        let totalTime = 0;
        for (let i = 0; i < iterations; i++) {
            const time = await measureQueryTime(query, params);
            totalTime += time;
        }
        const avgTime = totalTime / iterations;
        console.log(`Average execution time for orders by date range query: ${avgTime.toFixed(2)}ms`);
        expect(avgTime).toBeLessThan(150);
        expect(explainResult.toLowerCase()).toContain('index');
    }, 10000);
});
//# sourceMappingURL=query-performance.test.js.map
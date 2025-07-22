import { performance } from 'perf_hooks';
import RedisService from '../../services/RedisService';
import { VehicleService } from '../../services/VehicleService';
import { VehicleRepository } from '../../../../shared/database/repositories/VehicleRepository';
import { VehicleValidator } from '../../validators/VehicleValidator';
import { Pool } from 'pg';
import { Vehicle, VehicleStatus, VehicleType } from '../../../../shared/types';

describe('Redis Cache Performance Tests', () => {
  let vehicleService: VehicleService;
  let vehicleRepository: VehicleRepository;
  let pool: Pool;
  let testVehicleId: string;
  
  beforeAll(async () => {
    // Set up database connection
    pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    // Set up repositories and services
    vehicleRepository = new VehicleRepository(pool);
    const vehicleValidator = new VehicleValidator();
    vehicleService = new VehicleService(vehicleRepository, vehicleValidator);
    
    // Create a test vehicle
    const testVehicle = await vehicleRepository.create({
      licensePlate: `TEST-CACHE-${Date.now()}`,
      type: VehicleType.VAN,
      capacity: {
        maxWeight: 1000,
        maxVolume: 10,
        maxPackages: 50
      },
      currentLocation: {
        latitude: 40.7128,
        longitude: -74.006
      },
      status: VehicleStatus.AVAILABLE,
      driverId: 'test-driver'
    });
    
    testVehicleId = testVehicle.id;
  }, 10000);
  
  afterAll(async () => {
    // Clean up test data
    if (testVehicleId) {
      await vehicleRepository.delete(testVehicleId);
    }
    
    // Close connections
    await RedisService.disconnect();
    await pool.end();
  });
  
  it('should demonstrate performance improvement with Redis cache', async () => {
    // First, clear any existing cache
    await RedisService.del(`vehicle:${testVehicleId}`);
    
    // Test without cache (first call)
    const start1 = performance.now();
    const vehicle1 = await vehicleService.findById(testVehicleId);
    const end1 = performance.now();
    const timeWithoutCache = end1 - start1;
    
    // Test with cache (second call)
    const start2 = performance.now();
    const vehicle2 = await vehicleService.findById(testVehicleId);
    const end2 = performance.now();
    const timeWithCache = end2 - start2;
    
    console.log(`Vehicle lookup without cache: ${timeWithoutCache.toFixed(2)}ms`);
    console.log(`Vehicle lookup with cache: ${timeWithCache.toFixed(2)}ms`);
    console.log(`Performance improvement: ${((timeWithoutCache - timeWithCache) / timeWithoutCache * 100).toFixed(2)}%`);
    
    // Verify that both calls returned the same data
    expect(vehicle1).toBeDefined();
    expect(vehicle2).toBeDefined();
    expect(vehicle1!.id).toBe(vehicle2!.id);
    
    // Expect cache to be faster
    expect(timeWithCache).toBeLessThan(timeWithoutCache);
  });
  
  it('should efficiently handle multiple concurrent cache operations', async () => {
    const iterations = 100;
    const key = `test-concurrent-${Date.now()}`;
    const value = { data: 'test-data', timestamp: Date.now() };
    
    // Test write performance
    const writeStart = performance.now();
    
    const writePromises = Array(iterations).fill(0).map((_, i) => 
      RedisService.setJson(`${key}-${i}`, { ...value, index: i })
    );
    
    await Promise.all(writePromises);
    
    const writeEnd = performance.now();
    const writeTime = writeEnd - writeStart;
    
    console.log(`Redis write performance (${iterations} concurrent writes): ${writeTime.toFixed(2)}ms`);
    console.log(`Average write time per operation: ${(writeTime / iterations).toFixed(2)}ms`);
    
    // Test read performance
    const readStart = performance.now();
    
    const readPromises = Array(iterations).fill(0).map((_, i) => 
      RedisService.getJson(`${key}-${i}`)
    );
    
    const results = await Promise.all(readPromises);
    
    const readEnd = performance.now();
    const readTime = readEnd - readStart;
    
    console.log(`Redis read performance (${iterations} concurrent reads): ${readTime.toFixed(2)}ms`);
    console.log(`Average read time per operation: ${(readTime / iterations).toFixed(2)}ms`);
    
    // Verify that all reads were successful
    expect(results.length).toBe(iterations);
    expect(results.every(r => r !== null)).toBe(true);
    
    // Clean up test keys
    const deletePromises = Array(iterations).fill(0).map((_, i) => 
      RedisService.del(`${key}-${i}`)
    );
    
    await Promise.all(deletePromises);
  }, 10000);
  
  it('should efficiently handle available vehicles in area query with cache', async () => {
    const latitude = 40.7128;
    const longitude = -74.006;
    const radiusKm = 50;
    
    // Clear any existing cache
    await RedisService.invalidatePattern('available_vehicles:*');
    
    // Test without cache (first call)
    const start1 = performance.now();
    const vehicles1 = await vehicleService.findAvailableVehiclesInArea(latitude, longitude, radiusKm);
    const end1 = performance.now();
    const timeWithoutCache = end1 - start1;
    
    // Test with cache (second call)
    const start2 = performance.now();
    const vehicles2 = await vehicleService.findAvailableVehiclesInArea(latitude, longitude, radiusKm);
    const end2 = performance.now();
    const timeWithCache = end2 - start2;
    
    console.log(`Available vehicles query without cache: ${timeWithoutCache.toFixed(2)}ms`);
    console.log(`Available vehicles query with cache: ${timeWithCache.toFixed(2)}ms`);
    console.log(`Performance improvement: ${((timeWithoutCache - timeWithCache) / timeWithoutCache * 100).toFixed(2)}%`);
    
    // Verify that both calls returned the same data
    expect(vehicles1.length).toBe(vehicles2.length);
    
    // Expect cache to be faster
    expect(timeWithCache).toBeLessThan(timeWithoutCache);
  });
});
import { performance } from 'perf_hooks';
import supertest from 'supertest';
import { app } from '../../index';
import { Pool } from 'pg';
import { OrderRepository } from '../../../../shared/database/repositories/OrderRepository';
import { Order, OrderStatus } from '../../../../shared/types';

const request = supertest(app);

// Mock data for testing
const mockOrder = {
  customerId: 'customer123',
  customerName: 'Test Customer',
  customerPhone: '555-1234',
  deliveryAddress: {
    street: '123 Main St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    coordinates: {
      latitude: 40.7128,
      longitude: -74.006
    }
  },
  packageDetails: [
    {
      id: 'pkg1',
      description: 'Test Package',
      weight: 5,
      dimensions: {
        length: 10,
        width: 10,
        height: 10
      },
      fragile: false
    }
  ],
  specialInstructions: 'Test instructions',
  status: 'pending' as OrderStatus
};

describe('Order API Performance Tests', () => {
  let orderIds: string[] = [];
  
  // Create test orders before running tests
  beforeAll(async () => {
    // Create 100 test orders
    for (let i = 0; i < 100; i++) {
      const response = await request
        .post('/api/orders')
        .send({
          ...mockOrder,
          customerName: `Test Customer ${i}`,
          customerPhone: `555-${i.toString().padStart(4, '0')}`
        });
      
      if (response.status === 201) {
        orderIds.push(response.body.id);
      }
    }
  }, 30000); // Increase timeout for creating test data
  
  // Clean up test orders after tests
  afterAll(async () => {
    // Connect to database directly to clean up
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    try {
      // Delete test orders
      if (orderIds.length > 0) {
        await pool.query(
          `DELETE FROM orders WHERE id = ANY($1)`,
          [orderIds]
        );
      }
    } finally {
      await pool.end();
    }
  });
  
  // Test GET /api/orders endpoint performance
  it('should handle GET /api/orders with pagination efficiently', async () => {
    const iterations = 10;
    const pageSizes = [10, 20, 50, 100];
    
    for (const pageSize of pageSizes) {
      const responseTimes: number[] = [];
      
      // Run multiple iterations to get average response time
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        
        const response = await request
          .get(`/api/orders?page=1&pageSize=${pageSize}`);
        
        const end = performance.now();
        responseTimes.push(end - start);
        
        expect(response.status).toBe(200);
        expect(response.body.items).toBeDefined();
        expect(response.body.pagination).toBeDefined();
        expect(response.body.items.length).toBeLessThanOrEqual(pageSize);
      }
      
      // Calculate average response time
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / iterations;
      
      console.log(`GET /api/orders with pageSize=${pageSize}: ${avgResponseTime.toFixed(2)}ms average response time`);
      
      // Assert that response time is within acceptable limits
      // Adjust these thresholds based on your performance requirements
      expect(avgResponseTime).toBeLessThan(500); // 500ms max response time
    }
  }, 30000); // Increase timeout for performance tests
  
  // Test GET /api/orders/:id endpoint performance
  it('should handle GET /api/orders/:id efficiently', async () => {
    if (orderIds.length === 0) {
      console.warn('No test orders available for performance testing');
      return;
    }
    
    const iterations = 20;
    const responseTimes: number[] = [];
    
    // Run multiple iterations to get average response time
    for (let i = 0; i < iterations; i++) {
      // Select a random order ID
      const orderId = orderIds[Math.floor(Math.random() * orderIds.length)];
      
      const start = performance.now();
      
      const response = await request
        .get(`/api/orders/${orderId}`);
      
      const end = performance.now();
      responseTimes.push(end - start);
      
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(orderId);
    }
    
    // Calculate average response time
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / iterations;
    
    console.log(`GET /api/orders/:id: ${avgResponseTime.toFixed(2)}ms average response time`);
    
    // Assert that response time is within acceptable limits
    expect(avgResponseTime).toBeLessThan(200); // 200ms max response time
  }, 10000);
  
  // Test POST /api/orders endpoint performance
  it('should handle POST /api/orders efficiently', async () => {
    const iterations = 10;
    const responseTimes: number[] = [];
    const createdIds: string[] = [];
    
    // Run multiple iterations to get average response time
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      const response = await request
        .post('/api/orders')
        .send({
          ...mockOrder,
          customerName: `Performance Test Customer ${i}`,
          customerPhone: `555-PERF-${i.toString().padStart(4, '0')}`
        });
      
      const end = performance.now();
      responseTimes.push(end - start);
      
      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      
      createdIds.push(response.body.id);
    }
    
    // Add created IDs to the list for cleanup
    orderIds = [...orderIds, ...createdIds];
    
    // Calculate average response time
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / iterations;
    
    console.log(`POST /api/orders: ${avgResponseTime.toFixed(2)}ms average response time`);
    
    // Assert that response time is within acceptable limits
    expect(avgResponseTime).toBeLessThan(300); // 300ms max response time
  });
  
  // Test GET /api/orders/status/:status endpoint performance
  it('should handle GET /api/orders/status/:status efficiently', async () => {
    const iterations = 10;
    const responseTimes: number[] = [];
    
    // Run multiple iterations to get average response time
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      const response = await request
        .get('/api/orders/status/pending?page=1&pageSize=20');
      
      const end = performance.now();
      responseTimes.push(end - start);
      
      expect(response.status).toBe(200);
      expect(response.body.items).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    }
    
    // Calculate average response time
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / iterations;
    
    console.log(`GET /api/orders/status/:status: ${avgResponseTime.toFixed(2)}ms average response time`);
    
    // Assert that response time is within acceptable limits
    expect(avgResponseTime).toBeLessThan(300); // 300ms max response time
  }, 10000);
});
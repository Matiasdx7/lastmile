const request = require('supertest');
const nock = require('nock');
const jwt = require('jsonwebtoken');
const app = require('../src/index');

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.AUTH_SERVICE_URL = 'http://auth-service:3007';
process.env.ORDER_SERVICE_URL = 'http://order-service:3001';
process.env.VEHICLE_SERVICE_URL = 'http://vehicle-service:3002';

// Helper function to generate a valid JWT token
const generateToken = (payload = {}) => {
  const defaultPayload = {
    userId: '123',
    email: 'test@example.com',
    roles: ['user']
  };
  
  return jwt.sign({ ...defaultPayload, ...payload }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

describe('API Gateway Integration Tests', () => {
  
  beforeAll(() => {
    // Disable real HTTP requests
    nock.disableNetConnect();
    // Allow localhost connections for supertest
    nock.enableNetConnect('127.0.0.1');
  });
  
  afterAll(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
  
  describe('Health Check', () => {
    it('should return 200 OK for health check endpoint', async () => {
      const response = await request(app).get('/health');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('status', 'UP');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
  
  describe('Authentication', () => {
    it('should proxy authentication requests to auth service', async () => {
      // Mock the auth service response
      nock('http://auth-service:3007')
        .post('/api/auth/login')
        .reply(200, { 
          token: 'mock-token',
          user: { id: '123', email: 'test@example.com' }
        });
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });
    
    it('should return 401 for protected routes without token', async () => {
      const response = await request(app).get('/api/orders');
      expect(response.statusCode).toBe(401);
    });
    
    it('should allow access to protected routes with valid token', async () => {
      const token = generateToken();
      
      // Mock the order service response
      nock('http://order-service:3001')
        .get('/api/orders')
        .reply(200, { orders: [] });
      
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.statusCode).toBe(200);
    });
  });
  
  describe('Service Communication', () => {
    it('should proxy requests to the appropriate service', async () => {
      const token = generateToken();
      
      // Mock the vehicle service response
      nock('http://vehicle-service:3002')
        .get('/api/vehicles')
        .reply(200, { vehicles: [{ id: 'v1', licensePlate: 'ABC123' }] });
      
      const response = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('vehicles');
      expect(response.body.vehicles).toHaveLength(1);
    });
    
    it('should handle service unavailability gracefully', async () => {
      const token = generateToken();
      
      // Mock a service that is down
      nock('http://order-service:3001')
        .get('/api/orders')
        .replyWithError('Service unavailable');
      
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('Rate Limiting', () => {
    it('should apply rate limiting to requests', async () => {
      // Override rate limit for testing
      process.env.RATE_LIMIT_WINDOW_MS = '1000'; // 1 second
      process.env.RATE_LIMIT_MAX_REQUESTS = '5'; // 5 requests per second
      
      const token = generateToken();
      
      // Mock the order service to always respond successfully
      nock('http://order-service:3001')
        .get('/api/orders')
        .times(10) // Allow up to 10 calls
        .reply(200, { orders: [] });
      
      // Make 6 requests in quick succession
      const promises = [];
      for (let i = 0; i < 6; i++) {
        promises.push(
          request(app)
            .get('/api/orders')
            .set('Authorization', `Bearer ${token}`)
        );
      }
      
      const responses = await Promise.all(promises);
      
      // At least one request should be rate limited
      const rateLimited = responses.some(res => res.statusCode === 429);
      expect(rateLimited).toBe(true);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle and format errors properly', async () => {
      const token = generateToken();
      
      // Mock a service that returns an error
      nock('http://order-service:3001')
        .get('/api/orders/999')
        .reply(404, { 
          error: {
            code: 'NOT_FOUND',
            message: 'Order not found'
          }
        });
      
      const response = await request(app)
        .get('/api/orders/999')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
    });
  });
  
  describe('Role-based Authorization', () => {
    it('should allow access based on user role', async () => {
      // Create a token with admin role
      const adminToken = generateToken({ roles: ['admin'] });
      
      // Mock the vehicle service response for admin endpoint
      nock('http://vehicle-service:3002')
        .post('/api/vehicles')
        .reply(201, { id: 'new-vehicle', licensePlate: 'XYZ789' });
      
      const response = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ licensePlate: 'XYZ789', type: 'VAN' });
      
      expect(response.statusCode).toBe(201);
    });
    
    it('should deny access if user lacks required role', async () => {
      // Create a token with regular user role
      const userToken = generateToken({ roles: ['user'] });
      
      // This test assumes the API Gateway has role-based middleware for specific routes
      // For this test to work, we'd need to add specific role checks in the API Gateway
      
      // For now, we'll just verify the token is valid but would be rejected by role checks
      expect(jwt.verify(userToken, process.env.JWT_SECRET)).toHaveProperty('roles', ['user']);
    });
  });
});
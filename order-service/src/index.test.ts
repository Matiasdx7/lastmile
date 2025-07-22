import request from 'supertest';
import app from './index';
import { OrderStatus } from '../../shared/types/enums/OrderStatus';
import { v4 as uuidv4 } from 'uuid';

// Mock database repositories
jest.mock('../../shared/database/repositories/OrderRepository', () => {
  const mockOrder = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    customerId: 'customer123',
    customerName: 'John Doe',
    customerPhone: '+1234567890',
    deliveryAddress: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      coordinates: {
        latitude: 37.7749,
        longitude: -122.4194
      }
    },
    packageDetails: [
      {
        id: 'pkg123',
        description: 'Test Package',
        weight: 10,
        dimensions: {
          length: 20,
          width: 15,
          height: 10
        },
        fragile: false
      }
    ],
    status: OrderStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return {
    OrderRepository: jest.fn().mockImplementation(() => {
      return {
        findById: jest.fn().mockImplementation((id) => {
          if (id === '123e4567-e89b-12d3-a456-426614174000') {
            return Promise.resolve(mockOrder);
          }
          return Promise.resolve(null);
        }),
        findAll: jest.fn().mockResolvedValue([mockOrder]),
        create: jest.fn().mockImplementation((order) => {
          return Promise.resolve({
            ...order,
            id: uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }),
        update: jest.fn().mockImplementation((id, updates) => {
          if (id === '123e4567-e89b-12d3-a456-426614174000') {
            return Promise.resolve({
              ...mockOrder,
              ...updates,
              updatedAt: new Date()
            });
          }
          return Promise.resolve(null);
        }),
        delete: jest.fn().mockResolvedValue(true),
        findByStatus: jest.fn().mockResolvedValue([mockOrder]),
        findByCustomerId: jest.fn().mockResolvedValue([mockOrder]),
        updateStatus: jest.fn().mockImplementation((id, status) => {
          if (id === '123e4567-e89b-12d3-a456-426614174000') {
            return Promise.resolve({
              ...mockOrder,
              status,
              updatedAt: new Date()
            });
          }
          return Promise.resolve(null);
        })
      };
    })
  };
});

// Mock database connection
jest.mock('../../shared/database/connection', () => {
  return {
    DatabaseConnection: {
      getInstance: jest.fn().mockImplementation(() => {
        return {
          initializePostgreSQL: jest.fn().mockResolvedValue({}),
          getPostgreSQLPool: jest.fn().mockReturnValue({}),
          closeConnections: jest.fn().mockResolvedValue(undefined)
        };
      })
    },
    getDatabaseConfigFromEnv: jest.fn().mockReturnValue({
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      username: 'test_user',
      password: 'test_password'
    })
  };
});

describe('Order Service API', () => {
  beforeAll(async () => {
    // Initialize the app before tests
    const initializeApp = (app as any).initializeApp;
    if (typeof initializeApp === 'function') {
      await initializeApp();
    }
  });

  describe('GET /', () => {
    it('should return API info', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Order Service API');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
    });
  });

  describe('POST /api/orders', () => {
    it('should create a new order', async () => {
      const orderData = {
        customerId: 'customer123',
        customerName: 'John Doe',
        customerPhone: '+1234567890',
        deliveryAddress: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          coordinates: {
            latitude: 37.7749,
            longitude: -122.4194
          }
        },
        packageDetails: [
          {
            description: 'Test Package',
            weight: 10,
            dimensions: {
              length: 20,
              width: 15,
              height: 10
            },
            fragile: false
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Order created successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
    });

    it('should return validation error for invalid order data', async () => {
      const invalidOrderData = {
        // Missing required fields
        customerName: 'John Doe'
      };

      const response = await request(app)
        .post('/api/orders')
        .send(invalidOrderData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/orders', () => {
    it('should return a list of orders', async () => {
      const response = await request(app).get('/api/orders');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Orders retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return an order by ID', async () => {
      const response = await request(app).get('/api/orders/123e4567-e89b-12d3-a456-426614174000');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Order retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', '123e4567-e89b-12d3-a456-426614174000');
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app).get('/api/orders/123e4567-e89b-12d3-a456-999999999999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/orders/:id', () => {
    it('should update an existing order', async () => {
      const updateData = {
        customerName: 'Jane Doe',
        specialInstructions: 'Please leave at the door'
      };

      const response = await request(app)
        .put('/api/orders/123e4567-e89b-12d3-a456-426614174000')
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Order updated successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('customerName', 'Jane Doe');
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    it('should update order status', async () => {
      const statusUpdate = {
        status: OrderStatus.CONSOLIDATED
      };

      const response = await request(app)
        .patch('/api/orders/123e4567-e89b-12d3-a456-426614174000/status')
        .send(statusUpdate);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Order status updated successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status', OrderStatus.CONSOLIDATED);
    });
  });
});
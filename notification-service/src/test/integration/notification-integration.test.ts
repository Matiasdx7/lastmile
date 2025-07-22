import request from 'supertest';
import app from '../../index';
import { NotificationPriority, NotificationType, RecipientType } from '../../services/NotificationService';

// Mock services
jest.mock('../../services/TwilioService');
jest.mock('../../services/FirebaseService');

describe('Notification Service Integration Tests', () => {
  describe('Notification Endpoints', () => {
    it('should process a notification request', async () => {
      // Arrange
      const notificationRequest = {
        orderId: 'order123',
        status: 'delivered',
        customerName: 'John Doe',
        customerPhone: '1234567890',
        deliveryAddress: {
          street: '123 Main St',
          city: 'City',
          state: 'State',
          zipCode: '12345'
        },
        timestamp: new Date().toISOString(),
        details: {
          signature: 'base64signature',
          photo: 'base64photo',
          notes: 'Delivered to front door'
        },
        recipientTypes: [RecipientType.CUSTOMER, RecipientType.COORDINATOR],
        notificationTypes: [NotificationType.SMS, NotificationType.PUSH],
        priority: NotificationPriority.HIGH
      };

      // Act
      const response = await request(app)
        .post('/api/notifications')
        .send(notificationRequest)
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Notification processed successfully');
      expect(response.body).toHaveProperty('orderId', 'order123');
      expect(response.body).toHaveProperty('status', 'delivered');
    });

    it('should return 400 for missing required fields', async () => {
      // Arrange
      const invalidRequest = {
        // Missing orderId
        status: 'delivered',
        // Missing customerName
        customerPhone: '1234567890',
        deliveryAddress: {
          street: '123 Main St',
          city: 'City',
          state: 'State',
          zipCode: '12345'
        },
        timestamp: new Date().toISOString(),
        details: {}
      };

      // Act
      const response = await request(app)
        .post('/api/notifications')
        .send(invalidRequest)
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required fields');
      expect(response.body).toHaveProperty('requiredFields');
    });
  });

  describe('SMS Template Endpoints', () => {
    it('should get all SMS templates', async () => {
      // Act
      const response = await request(app)
        .get('/api/sms/templates')
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('templates');
      expect(Array.isArray(response.body.templates)).toBe(true);
    });

    it('should create a new SMS template', async () => {
      // Arrange
      const template = {
        name: 'test_template',
        content: 'This is a test template for {{purpose}}'
      };

      // Act
      const response = await request(app)
        .post('/api/sms/templates')
        .send(template)
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Template created successfully');
      expect(response.body).toHaveProperty('template');
      expect(response.body.template).toHaveProperty('name', 'test_template');
      expect(response.body.template).toHaveProperty('content', 'This is a test template for {{purpose}}');
    });

    it('should return 400 for invalid template creation', async () => {
      // Arrange
      const invalidTemplate = {
        // Missing name
        content: 'This is a test template'
      };

      // Act
      const response = await request(app)
        .post('/api/sms/templates')
        .send(invalidTemplate)
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Name and content are required');
    });
  });

  describe('Device Registration Endpoints', () => {
    it('should register a device for push notifications', async () => {
      // Arrange
      const device = {
        userId: 'user123',
        deviceToken: 'device-token-123',
        deviceType: 'android',
        role: 'driver'
      };

      // Act
      const response = await request(app)
        .post('/api/notifications/devices')
        .send(device)
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Device registered successfully');
      expect(response.body).toHaveProperty('deviceToken', 'device-token-123');
    });

    it('should return 400 for invalid device registration', async () => {
      // Arrange
      const invalidDevice = {
        userId: 'user123',
        // Missing deviceToken
        deviceType: 'android',
        role: 'driver'
      };

      // Act
      const response = await request(app)
        .post('/api/notifications/devices')
        .send(invalidDevice)
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required fields');
      expect(response.body).toHaveProperty('requiredFields');
    });

    it('should unregister a device', async () => {
      // Arrange
      const device = {
        deviceToken: 'device-token-123'
      };

      // Act
      const response = await request(app)
        .delete('/api/notifications/devices')
        .send(device)
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Device unregistered successfully');
      expect(response.body).toHaveProperty('deviceToken', 'device-token-123');
    });
  });

  describe('Push Notification Endpoints', () => {
    it('should send a push notification', async () => {
      // Arrange
      const notification = {
        title: 'Test Notification',
        body: 'This is a test notification',
        data: { key: 'value' },
        tokens: ['device-token-1', 'device-token-2']
      };

      // Act
      const response = await request(app)
        .post('/api/notifications/push')
        .send(notification)
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Push notification sent successfully');
    });

    it('should send a push notification to a role', async () => {
      // Arrange
      const notification = {
        role: 'driver',
        title: 'Driver Notification',
        body: 'This is a notification for all drivers',
        data: { key: 'value' }
      };

      // Act
      const response = await request(app)
        .post('/api/notifications/push/role')
        .send(notification)
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Push notification sent successfully to role: driver');
    });

    it('should return 400 for invalid push notification', async () => {
      // Arrange
      const invalidNotification = {
        // Missing title
        body: 'This is a test notification',
        tokens: ['device-token-1']
      };

      // Act
      const response = await request(app)
        .post('/api/notifications/push')
        .send(invalidNotification)
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required fields');
      expect(response.body).toHaveProperty('requiredFields');
    });
  });
});
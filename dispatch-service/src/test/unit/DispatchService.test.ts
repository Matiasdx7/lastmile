import { DispatchService } from '../../services/DispatchService';
import { WebSocketManager, NotificationType } from '../../services/WebSocketManager';
import {
  Dispatch,
  DispatchStatus,
  Route,
  RouteStatus,
  OrderStatus,
  DeliveryStatus,
  VehicleStatus,
  Location
} from '../../../../shared/types';
import axios from 'axios';

// Mock dependencies
jest.mock('../../../../shared/database/repositories/DispatchRepository');
jest.mock('../../../../shared/database/repositories/RouteRepository');
jest.mock('../../../../shared/database/repositories/OrderRepository');
jest.mock('../../../../shared/database/repositories/VehicleRepository');
jest.mock('../../services/WebSocketManager');
jest.mock('axios');

describe('DispatchService', () => {
  let dispatchService: DispatchService;
  let mockDispatchRepository: any;
  let mockRouteRepository: any;
  let mockOrderRepository: any;
  let mockVehicleRepository: any;
  let mockWebSocketManager: jest.Mocked<WebSocketManager>;

  beforeEach(() => {
    // Create mocks for repositories
    mockDispatchRepository = {
      findById: jest.fn(),
      findByRouteId: jest.fn(),
      findAll: jest.fn(),
      findByStatus: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      startDispatch: jest.fn()
    };

    mockRouteRepository = {
      findById: jest.fn(),
      findByStopId: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn()
    };

    mockOrderRepository = {
      findById: jest.fn(),
      updateStatus: jest.fn()
    };

    mockVehicleRepository = {
      findById: jest.fn(),
      updateLocation: jest.fn(),
      updateStatus: jest.fn()
    };

    // Create mock for WebSocketManager
    mockWebSocketManager = new WebSocketManager(3014) as jest.Mocked<WebSocketManager>;

    // Create service with mocks
    dispatchService = new DispatchService(
      mockDispatchRepository,
      mockRouteRepository,
      mockOrderRepository,
      mockVehicleRepository,
      3014
    );

    // Replace the WebSocketManager instance with our mock
    (dispatchService as any).webSocketManager = mockWebSocketManager;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Tests for existing methods...

  describe('recordDeliverySuccess', () => {
    it('should record a successful delivery and update order status', async () => {
      // Arrange
      const stopId = 'stop123';
      const orderId = 'order123';
      const proof = {
        signature: 'base64signature',
        photo: 'base64photo',
        notes: 'Delivered to front door',
        timestamp: new Date().toISOString()
      };

      const mockRoute = {
        id: 'route123',
        stops: [
          {
            orderId: 'order123',
            sequence: 1,
            address: { street: '123 Main St', city: 'City', state: 'State', zipCode: '12345', coordinates: { latitude: 0, longitude: 0 } },
            estimatedArrival: new Date()
          }
        ]
      };

      const mockDispatch = {
        id: 'dispatch123',
        routeId: 'route123',
        vehicleId: 'vehicle123',
        driverId: 'driver123',
        status: DispatchStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockOrder = {
        id: 'order123',
        customerName: 'John Doe',
        customerPhone: '1234567890',
        deliveryAddress: { street: '123 Main St', city: 'City', state: 'State', zipCode: '12345', coordinates: { latitude: 0, longitude: 0 } }
      };

      mockRouteRepository.findByStopId.mockResolvedValue(mockRoute);
      mockDispatchRepository.findByRouteId.mockResolvedValue(mockDispatch);
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockRouteRepository.update.mockResolvedValue(true);
      mockOrderRepository.updateStatus.mockResolvedValue(true);

      // Mock checkRouteCompletion to return not completed
      jest.spyOn(dispatchService, 'checkRouteCompletion').mockResolvedValue({
        isCompleted: false,
        completedStops: 1,
        totalStops: 2,
        remainingStops: 1
      });

      // Mock sendDeliveryNotifications
      jest.spyOn(dispatchService, 'sendDeliveryNotifications').mockResolvedValue();

      // Act
      const result = await dispatchService.recordDeliverySuccess(stopId, orderId, proof);

      // Assert
      expect(result).toBe(true);
      expect(mockRouteRepository.findByStopId).toHaveBeenCalledWith(stopId);
      expect(mockDispatchRepository.findByRouteId).toHaveBeenCalledWith('route123');
      expect(mockRouteRepository.update).toHaveBeenCalledWith('route123', expect.objectContaining({
        stops: expect.arrayContaining([
          expect.objectContaining({
            orderId: 'order123',
            deliveryStatus: DeliveryStatus.DELIVERED,
            deliveryProof: expect.objectContaining({
              signature: 'base64signature',
              photo: 'base64photo',
              notes: 'Delivered to front door'
            })
          })
        ])
      }));
      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith('order123', OrderStatus.DELIVERED);
      expect(dispatchService.sendDeliveryNotifications).toHaveBeenCalledWith(
        'order123',
        'dispatch123',
        'delivered',
        proof
      );
      expect(dispatchService.checkRouteCompletion).toHaveBeenCalledWith('dispatch123');
    });

    it('should update dispatch and vehicle status when all deliveries are completed', async () => {
      // Arrange
      const stopId = 'stop123';
      const orderId = 'order123';
      const proof = {
        signature: 'base64signature',
        photo: 'base64photo',
        notes: 'Delivered to front door',
        timestamp: new Date().toISOString()
      };

      const mockRoute = {
        id: 'route123',
        stops: [
          {
            orderId: 'order123',
            sequence: 1,
            address: { street: '123 Main St', city: 'City', state: 'State', zipCode: '12345', coordinates: { latitude: 0, longitude: 0 } },
            estimatedArrival: new Date()
          }
        ]
      };

      const mockDispatch = {
        id: 'dispatch123',
        routeId: 'route123',
        vehicleId: 'vehicle123',
        driverId: 'driver123',
        status: DispatchStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockOrder = {
        id: 'order123',
        customerName: 'John Doe',
        customerPhone: '1234567890',
        deliveryAddress: { street: '123 Main St', city: 'City', state: 'State', zipCode: '12345', coordinates: { latitude: 0, longitude: 0 } }
      };

      mockRouteRepository.findByStopId.mockResolvedValue(mockRoute);
      mockDispatchRepository.findByRouteId.mockResolvedValue(mockDispatch);
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockRouteRepository.update.mockResolvedValue(true);
      mockOrderRepository.updateStatus.mockResolvedValue(true);
      mockDispatchRepository.updateStatus.mockResolvedValue(true);
      mockVehicleRepository.updateStatus.mockResolvedValue(true);

      // Mock checkRouteCompletion to return completed
      jest.spyOn(dispatchService, 'checkRouteCompletion').mockResolvedValue({
        isCompleted: true,
        completedStops: 1,
        totalStops: 1,
        remainingStops: 0
      });

      // Mock sendDeliveryNotifications
      jest.spyOn(dispatchService, 'sendDeliveryNotifications').mockResolvedValue();

      // Mock updateDispatchStatus
      jest.spyOn(dispatchService, 'updateDispatchStatus').mockResolvedValue(mockDispatch);

      // Act
      const result = await dispatchService.recordDeliverySuccess(stopId, orderId, proof);

      // Assert
      expect(result).toBe(true);
      expect(dispatchService.updateDispatchStatus).toHaveBeenCalledWith('dispatch123', DispatchStatus.COMPLETED);
      expect(mockVehicleRepository.updateStatus).toHaveBeenCalledWith('vehicle123', VehicleStatus.AVAILABLE);
    });

    it('should return false when route is not found', async () => {
      // Arrange
      const stopId = 'stop123';
      const orderId = 'order123';
      const proof = {
        signature: 'base64signature',
        photo: 'base64photo',
        notes: 'Delivered to front door',
        timestamp: new Date().toISOString()
      };

      mockRouteRepository.findByStopId.mockResolvedValue(null);

      // Act
      const result = await dispatchService.recordDeliverySuccess(stopId, orderId, proof);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('recordDeliveryFailure', () => {
    it('should record a delivery failure and update order status', async () => {
      // Arrange
      const stopId = 'stop123';
      const orderId = 'order123';
      const failureDetails = {
        reason: 'customer_not_available',
        notes: 'No one answered the door',
        photo: 'base64photo',
        nextAction: 'retry_later',
        timestamp: new Date().toISOString()
      };

      const mockRoute = {
        id: 'route123',
        stops: [
          {
            orderId: 'order123',
            sequence: 1,
            address: { street: '123 Main St', city: 'City', state: 'State', zipCode: '12345', coordinates: { latitude: 0, longitude: 0 } },
            estimatedArrival: new Date()
          }
        ]
      };

      const mockDispatch = {
        id: 'dispatch123',
        routeId: 'route123',
        vehicleId: 'vehicle123',
        driverId: 'driver123',
        status: DispatchStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockOrder = {
        id: 'order123',
        customerName: 'John Doe',
        customerPhone: '1234567890',
        deliveryAddress: { street: '123 Main St', city: 'City', state: 'State', zipCode: '12345', coordinates: { latitude: 0, longitude: 0 } }
      };

      mockRouteRepository.findByStopId.mockResolvedValue(mockRoute);
      mockDispatchRepository.findByRouteId.mockResolvedValue(mockDispatch);
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockRouteRepository.update.mockResolvedValue(true);
      mockOrderRepository.updateStatus.mockResolvedValue(true);

      // Mock checkRouteCompletion to return not completed
      jest.spyOn(dispatchService, 'checkRouteCompletion').mockResolvedValue({
        isCompleted: false,
        completedStops: 1,
        totalStops: 2,
        remainingStops: 1
      });

      // Mock sendDeliveryNotifications
      jest.spyOn(dispatchService, 'sendDeliveryNotifications').mockResolvedValue();

      // Act
      const result = await dispatchService.recordDeliveryFailure(stopId, orderId, failureDetails);

      // Assert
      expect(result).toBe(true);
      expect(mockRouteRepository.findByStopId).toHaveBeenCalledWith(stopId);
      expect(mockDispatchRepository.findByRouteId).toHaveBeenCalledWith('route123');
      expect(mockRouteRepository.update).toHaveBeenCalledWith('route123', expect.objectContaining({
        stops: expect.arrayContaining([
          expect.objectContaining({
            orderId: 'order123',
            deliveryStatus: DeliveryStatus.FAILED,
            deliveryProof: expect.objectContaining({
              failureReason: 'customer_not_available',
              photo: 'base64photo',
              notes: 'No one answered the door',
              nextAction: 'retry_later'
            })
          })
        ])
      }));
      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith('order123', OrderStatus.FAILED);
      expect(dispatchService.sendDeliveryNotifications).toHaveBeenCalledWith(
        'order123',
        'dispatch123',
        'failed',
        failureDetails
      );
    });
  });

  describe('checkRouteCompletion', () => {
    it('should return correct completion status when all stops are completed', async () => {
      // Arrange
      const dispatchId = 'dispatch123';
      
      const mockDispatch = {
        id: 'dispatch123',
        routeId: 'route123',
        vehicleId: 'vehicle123',
        driverId: 'driver123',
        status: DispatchStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockRoute = {
        id: 'route123',
        stops: [
          {
            orderId: 'order1',
            sequence: 1,
            deliveryStatus: DeliveryStatus.DELIVERED
          },
          {
            orderId: 'order2',
            sequence: 2,
            deliveryStatus: DeliveryStatus.DELIVERED
          }
        ]
      };

      mockDispatchRepository.findById.mockResolvedValue(mockDispatch);
      mockRouteRepository.findById.mockResolvedValue(mockRoute);

      // Act
      const result = await dispatchService.checkRouteCompletion(dispatchId);

      // Assert
      expect(result).toEqual({
        isCompleted: true,
        completedStops: 2,
        totalStops: 2,
        remainingStops: 0
      });
    });

    it('should return correct completion status when some stops are not completed', async () => {
      // Arrange
      const dispatchId = 'dispatch123';
      
      const mockDispatch = {
        id: 'dispatch123',
        routeId: 'route123',
        vehicleId: 'vehicle123',
        driverId: 'driver123',
        status: DispatchStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockRoute = {
        id: 'route123',
        stops: [
          {
            orderId: 'order1',
            sequence: 1,
            deliveryStatus: DeliveryStatus.DELIVERED
          },
          {
            orderId: 'order2',
            sequence: 2,
            // No delivery status means not completed
          }
        ]
      };

      mockDispatchRepository.findById.mockResolvedValue(mockDispatch);
      mockRouteRepository.findById.mockResolvedValue(mockRoute);

      // Act
      const result = await dispatchService.checkRouteCompletion(dispatchId);

      // Assert
      expect(result).toEqual({
        isCompleted: false,
        completedStops: 1,
        totalStops: 2,
        remainingStops: 1
      });
    });

    it('should return default values when dispatch is not found', async () => {
      // Arrange
      const dispatchId = 'dispatch123';
      
      mockDispatchRepository.findById.mockResolvedValue(null);

      // Act
      const result = await dispatchService.checkRouteCompletion(dispatchId);

      // Assert
      expect(result).toEqual({
        isCompleted: false,
        completedStops: 0,
        totalStops: 0,
        remainingStops: 0
      });
    });
  });

  describe('sendDeliveryNotifications', () => {
    it('should send notification for successful delivery', async () => {
      // Arrange
      const orderId = 'order123';
      const dispatchId = 'dispatch123';
      const status = 'delivered';
      const details = {
        signature: 'base64signature',
        photo: 'base64photo',
        notes: 'Delivered to front door',
        timestamp: new Date().toISOString()
      };

      const mockOrder = {
        id: 'order123',
        customerName: 'John Doe',
        customerPhone: '1234567890',
        deliveryAddress: { street: '123 Main St', city: 'City', state: 'State', zipCode: '12345', coordinates: { latitude: 0, longitude: 0 } }
      };

      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      (axios.post as jest.Mock).mockResolvedValue({ data: { success: true } });

      // Act
      await dispatchService.sendDeliveryNotifications(orderId, dispatchId, status, details);

      // Assert
      expect(mockOrderRepository.findById).toHaveBeenCalledWith(orderId);
      expect(axios.post).toHaveBeenCalledWith(
        'http://notification-service:3005/api/notifications',
        expect.objectContaining({
          orderId,
          dispatchId,
          status,
          customerName: 'John Doe',
          customerPhone: '1234567890',
          details
        })
      );
    });

    it('should send notification for failed delivery', async () => {
      // Arrange
      const orderId = 'order123';
      const dispatchId = 'dispatch123';
      const status = 'failed';
      const details = {
        reason: 'customer_not_available',
        notes: 'No one answered the door',
        photo: 'base64photo',
        nextAction: 'retry_later',
        timestamp: new Date().toISOString()
      };

      const mockOrder = {
        id: 'order123',
        customerName: 'John Doe',
        customerPhone: '1234567890',
        deliveryAddress: { street: '123 Main St', city: 'City', state: 'State', zipCode: '12345', coordinates: { latitude: 0, longitude: 0 } }
      };

      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      (axios.post as jest.Mock).mockResolvedValue({ data: { success: true } });

      // Act
      await dispatchService.sendDeliveryNotifications(orderId, dispatchId, status, details);

      // Assert
      expect(mockOrderRepository.findById).toHaveBeenCalledWith(orderId);
      expect(axios.post).toHaveBeenCalledWith(
        'http://notification-service:3005/api/notifications',
        expect.objectContaining({
          orderId,
          dispatchId,
          status,
          customerName: 'John Doe',
          customerPhone: '1234567890',
          details
        })
      );
    });

    it('should use WebSocket as fallback when notification service fails', async () => {
      // Arrange
      const orderId = 'order123';
      const dispatchId = 'dispatch123';
      const status = 'delivered';
      const details = {
        signature: 'base64signature',
        photo: 'base64photo',
        notes: 'Delivered to front door',
        timestamp: new Date().toISOString()
      };

      const mockOrder = {
        id: 'order123',
        customerName: 'John Doe',
        customerPhone: '1234567890',
        deliveryAddress: { street: '123 Main St', city: 'City', state: 'State', zipCode: '12345', coordinates: { latitude: 0, longitude: 0 } }
      };

      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      (axios.post as jest.Mock).mockRejectedValue(new Error('Service unavailable'));

      // Act
      await dispatchService.sendDeliveryNotifications(orderId, dispatchId, status, details);

      // Assert
      expect(mockOrderRepository.findById).toHaveBeenCalledWith(orderId);
      expect(axios.post).toHaveBeenCalledWith(
        'http://notification-service:3005/api/notifications',
        expect.anything()
      );
      expect(mockWebSocketManager.broadcastCriticalNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          dispatchId,
          type: NotificationType.DELIVERY_EXCEPTION,
          message: expect.stringContaining('delivered successfully')
        })
      );
    });
  });
});
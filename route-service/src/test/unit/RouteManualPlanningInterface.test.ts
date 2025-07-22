import { Request, Response } from 'express';
import { Pool } from 'pg';
import RouteController from '../../controllers/RouteController';
import RouteService from '../../services/RouteService';
import { Route, RouteStatus } from '../../../../shared/types';

// Mock dependencies
jest.mock('../../services/RouteService');

describe('Route Manual Planning Interface', () => {
  let routeController: RouteController;
  let mockRouteService: jest.Mocked<RouteService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockPool: Pool;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock pool
    mockPool = {} as Pool;
    
    // Create the controller
    routeController = new RouteController(mockPool);
    
    // Get the mocked service instance
    mockRouteService = (RouteService as jest.MockedClass<typeof RouteService>).mock.instances[0] as jest.Mocked<RouteService>;
    
    // Create mock request and response
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('getRouteMapData', () => {
    it('should return route map data with 200 status', async () => {
      // Mock request params
      mockReq.params = { id: 'route-123' };
      
      // Mock service responses
      const mockRoute: Route = {
        id: 'route-123',
        loadId: 'load-123',
        vehicleId: 'vehicle-456',
        stops: [],
        totalDistance: 0,
        estimatedDuration: 0,
        status: RouteStatus.PLANNED,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockRouteService.getRouteById.mockResolvedValue(mockRoute);
      
      const mockMapData = {
        polyline: 'encoded_polyline_string',
        waypoints: [
          {
            location: { latitude: 37.7749, longitude: -122.4194 },
            orderId: 'order-1',
            sequence: 0,
            estimatedArrival: new Date()
          },
          {
            location: { latitude: 37.7833, longitude: -122.4167 },
            orderId: 'order-2',
            sequence: 1,
            estimatedArrival: new Date()
          }
        ]
      };
      mockRouteService.generateRouteMapData.mockResolvedValue(mockMapData);
      
      // Call the controller method
      await routeController.getRouteMapData(mockReq as Request, mockRes as Response);
      
      // Verify service was called with correct parameters
      expect(mockRouteService.getRouteById).toHaveBeenCalledWith('route-123');
      expect(mockRouteService.generateRouteMapData).toHaveBeenCalledWith('route-123');
      
      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockMapData);
    });

    it('should return 404 if route not found', async () => {
      // Mock request params
      mockReq.params = { id: 'non-existent-id' };
      
      // Mock service to return null
      mockRouteService.getRouteById.mockResolvedValue(null);
      
      // Call the controller method
      await routeController.getRouteMapData(mockReq as Request, mockRes as Response);
      
      // Verify service was called
      expect(mockRouteService.getRouteById).toHaveBeenCalledWith('non-existent-id');
      expect(mockRouteService.generateRouteMapData).not.toHaveBeenCalled();
      
      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Route not found with ID: non-existent-id'
      });
    });

    it('should return 500 if service throws an error', async () => {
      // Mock request params
      mockReq.params = { id: 'route-123' };
      
      // Mock service responses
      const mockRoute: Route = {
        id: 'route-123',
        loadId: 'load-123',
        vehicleId: 'vehicle-456',
        stops: [],
        totalDistance: 0,
        estimatedDuration: 0,
        status: RouteStatus.PLANNED,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockRouteService.getRouteById.mockResolvedValue(mockRoute);
      
      // Mock service to throw an error
      const error = new Error('Map service error');
      mockRouteService.generateRouteMapData.mockRejectedValue(error);
      
      // Call the controller method
      await routeController.getRouteMapData(mockReq as Request, mockRes as Response);
      
      // Verify service was called
      expect(mockRouteService.getRouteById).toHaveBeenCalledWith('route-123');
      expect(mockRouteService.generateRouteMapData).toHaveBeenCalledWith('route-123');
      
      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to get route map data',
        message: 'Map service error'
      });
    });
  });

  describe('reorderRouteStops', () => {
    it('should reorder route stops and return 200 status', async () => {
      // Mock request params and body
      mockReq.params = { id: 'route-123' };
      mockReq.body = {
        stopOrder: ['order-2', 'order-1', 'order-3'] // New order of orderIds
      };
      
      // Mock service response
      const mockUpdatedRoute: Route = {
        id: 'route-123',
        loadId: 'load-123',
        vehicleId: 'vehicle-456',
        stops: [
          {
            orderId: 'order-2',
            address: {
              street: '456 Market St',
              city: 'San Francisco',
              state: 'CA',
              zipCode: '94105',
              coordinates: { latitude: 37.7900, longitude: -122.4000 }
            },
            sequence: 0,
            estimatedArrival: new Date()
          },
          {
            orderId: 'order-1',
            address: {
              street: '123 Main St',
              city: 'San Francisco',
              state: 'CA',
              zipCode: '94105',
              coordinates: { latitude: 37.7749, longitude: -122.4194 }
            },
            sequence: 1,
            estimatedArrival: new Date()
          },
          {
            orderId: 'order-3',
            address: {
              street: '789 Howard St',
              city: 'San Francisco',
              state: 'CA',
              zipCode: '94105',
              coordinates: { latitude: 37.7850, longitude: -122.4050 }
            },
            sequence: 2,
            estimatedArrival: new Date()
          }
        ],
        totalDistance: 3000,
        estimatedDuration: 900,
        status: RouteStatus.PLANNED,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockRouteService.reorderRouteStops.mockResolvedValue(mockUpdatedRoute);
      
      // Call the controller method
      await routeController.reorderRouteStops(mockReq as Request, mockRes as Response);
      
      // Verify service was called with correct parameters
      expect(mockRouteService.reorderRouteStops).toHaveBeenCalledWith(
        'route-123',
        ['order-2', 'order-1', 'order-3']
      );
      
      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockUpdatedRoute);
    });

    it('should return 400 if stopOrder is missing', async () => {
      // Mock request params with missing body
      mockReq.params = { id: 'route-123' };
      mockReq.body = {};
      
      // Call the controller method
      await routeController.reorderRouteStops(mockReq as Request, mockRes as Response);
      
      // Verify service was not called
      expect(mockRouteService.reorderRouteStops).not.toHaveBeenCalled();
      
      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid request. stopOrder array is required.'
      });
    });

    it('should return 404 if route not found', async () => {
      // Mock request params and body
      mockReq.params = { id: 'non-existent-id' };
      mockReq.body = {
        stopOrder: ['order-1', 'order-2']
      };
      
      // Mock service to return null
      mockRouteService.reorderRouteStops.mockResolvedValue(null);
      
      // Call the controller method
      await routeController.reorderRouteStops(mockReq as Request, mockRes as Response);
      
      // Verify service was called
      expect(mockRouteService.reorderRouteStops).toHaveBeenCalledWith(
        'non-existent-id',
        ['order-1', 'order-2']
      );
      
      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Route not found with ID: non-existent-id'
      });
    });
  });

  describe('getTimeWindowConflicts', () => {
    it('should return time window conflicts with 200 status', async () => {
      // Mock request params and body
      mockReq.params = { id: 'route-123' };
      mockReq.body = {
        orders: [
          {
            id: 'order-1',
            timeWindow: {
              startTime: '2023-01-01T11:00:00Z',
              endTime: '2023-01-01T14:00:00Z'
            }
          },
          {
            id: 'order-2',
            timeWindow: {
              startTime: '2023-01-01T12:30:00Z',
              endTime: '2023-01-01T15:30:00Z'
            }
          }
        ]
      };
      
      // Mock service response
      const mockConflicts = [
        'Stop for order order-1: Estimated arrival at 10:00:00 AM is before the time window starts at 11:00:00 AM'
      ];
      mockRouteService.validateTimeWindows.mockResolvedValue(mockConflicts);
      
      // Call the controller method
      await routeController.getTimeWindowConflicts(mockReq as Request, mockRes as Response);
      
      // Verify service was called with correct parameters
      expect(mockRouteService.validateTimeWindows).toHaveBeenCalledWith(
        'route-123',
        mockReq.body.orders
      );
      
      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ conflicts: mockConflicts });
    });

    it('should return 400 if orders array is missing', async () => {
      // Mock request params with missing body
      mockReq.params = { id: 'route-123' };
      mockReq.body = {};
      
      // Call the controller method
      await routeController.getTimeWindowConflicts(mockReq as Request, mockRes as Response);
      
      // Verify service was not called
      expect(mockRouteService.validateTimeWindows).not.toHaveBeenCalled();
      
      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid request. orders array is required.'
      });
    });

    it('should return 404 if route not found', async () => {
      // Mock request params and body
      mockReq.params = { id: 'non-existent-id' };
      mockReq.body = {
        orders: [
          {
            id: 'order-1',
            timeWindow: {
              startTime: '2023-01-01T11:00:00Z',
              endTime: '2023-01-01T14:00:00Z'
            }
          }
        ]
      };
      
      // Mock service to return null
      mockRouteService.validateTimeWindows.mockResolvedValue(null);
      
      // Call the controller method
      await routeController.getTimeWindowConflicts(mockReq as Request, mockRes as Response);
      
      // Verify service was called
      expect(mockRouteService.validateTimeWindows).toHaveBeenCalledWith(
        'non-existent-id',
        mockReq.body.orders
      );
      
      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Route not found with ID: non-existent-id'
      });
    });
  });
});
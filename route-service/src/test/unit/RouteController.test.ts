import { Request, Response } from 'express';
import { Pool } from 'pg';
import RouteController from '../../controllers/RouteController';
import RouteService from '../../services/RouteService';
import { Route, RouteStatus } from '../../../../shared/types';

// Mock dependencies
jest.mock('../../services/RouteService');

describe('RouteController', () => {
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

  describe('createRoute', () => {
    it('should create a route and return 201 status', async () => {
      // Mock request body
      mockReq.body = {
        loadId: 'load-123',
        vehicleId: 'vehicle-456',
        stops: [
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
          }
        ]
      };
      
      // Mock service response
      const mockRoute: Route = {
        id: 'route-789',
        loadId: 'load-123',
        vehicleId: 'vehicle-456',
        stops: mockReq.body.stops,
        totalDistance: 0,
        estimatedDuration: 0,
        status: RouteStatus.PLANNED,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockRouteService.createRoute.mockResolvedValue(mockRoute);
      
      // Call the controller method
      await routeController.createRoute(mockReq as Request, mockRes as Response);
      
      // Verify service was called with correct parameters
      expect(mockRouteService.createRoute).toHaveBeenCalledWith(
        'load-123',
        'vehicle-456',
        mockReq.body.stops
      );
      
      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockRoute);
    });

    it('should return 400 if required parameters are missing', async () => {
      // Mock request with missing parameters
      mockReq.body = {
        loadId: 'load-123'
        // Missing vehicleId and stops
      };
      
      // Call the controller method
      await routeController.createRoute(mockReq as Request, mockRes as Response);
      
      // Verify service was not called
      expect(mockRouteService.createRoute).not.toHaveBeenCalled();
      
      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid request. loadId, vehicleId, and stops array are required.'
      });
    });

    it('should return 500 if service throws an error', async () => {
      // Mock request body
      mockReq.body = {
        loadId: 'load-123',
        vehicleId: 'vehicle-456',
        stops: [
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
          }
        ]
      };
      
      // Mock service to throw an error
      const error = new Error('Service error');
      mockRouteService.createRoute.mockRejectedValue(error);
      
      // Call the controller method
      await routeController.createRoute(mockReq as Request, mockRes as Response);
      
      // Verify service was called
      expect(mockRouteService.createRoute).toHaveBeenCalled();
      
      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to create route',
        message: 'Service error'
      });
    });
  });

  describe('getRoute', () => {
    it('should return a route by ID with 200 status', async () => {
      // Mock request params
      mockReq.params = { id: 'route-123' };
      
      // Mock service response
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
      
      // Call the controller method
      await routeController.getRoute(mockReq as Request, mockRes as Response);
      
      // Verify service was called
      expect(mockRouteService.getRouteById).toHaveBeenCalledWith('route-123');
      
      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockRoute);
    });

    it('should return 404 if route not found', async () => {
      // Mock request params
      mockReq.params = { id: 'non-existent-id' };
      
      // Mock service to return null
      mockRouteService.getRouteById.mockResolvedValue(null);
      
      // Call the controller method
      await routeController.getRoute(mockReq as Request, mockRes as Response);
      
      // Verify service was called
      expect(mockRouteService.getRouteById).toHaveBeenCalledWith('non-existent-id');
      
      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Route not found with ID: non-existent-id'
      });
    });
  });

  describe('getRoutes', () => {
    it('should return all routes with 200 status when no status filter', async () => {
      // Mock request query (empty)
      mockReq.query = {};
      
      // Mock service response
      const mockRoutes: Route[] = [
        {
          id: 'route-1',
          loadId: 'load-1',
          vehicleId: 'vehicle-1',
          stops: [],
          totalDistance: 0,
          estimatedDuration: 0,
          status: RouteStatus.PLANNED,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'route-2',
          loadId: 'load-2',
          vehicleId: 'vehicle-2',
          stops: [],
          totalDistance: 0,
          estimatedDuration: 0,
          status: RouteStatus.DISPATCHED,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      mockRouteService.getAllRoutes.mockResolvedValue(mockRoutes);
      
      // Call the controller method
      await routeController.getRoutes(mockReq as Request, mockRes as Response);
      
      // Verify service was called
      expect(mockRouteService.getAllRoutes).toHaveBeenCalled();
      expect(mockRouteService.getRoutesByStatus).not.toHaveBeenCalled();
      
      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockRoutes);
    });

    it('should return routes filtered by status with 200 status', async () => {
      // Mock request query with status filter
      mockReq.query = { status: RouteStatus.PLANNED };
      
      // Mock service response
      const mockRoutes: Route[] = [
        {
          id: 'route-1',
          loadId: 'load-1',
          vehicleId: 'vehicle-1',
          stops: [],
          totalDistance: 0,
          estimatedDuration: 0,
          status: RouteStatus.PLANNED,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      mockRouteService.getRoutesByStatus.mockResolvedValue(mockRoutes);
      
      // Call the controller method
      await routeController.getRoutes(mockReq as Request, mockRes as Response);
      
      // Verify service was called with correct status
      expect(mockRouteService.getRoutesByStatus).toHaveBeenCalledWith(RouteStatus.PLANNED);
      expect(mockRouteService.getAllRoutes).not.toHaveBeenCalled();
      
      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockRoutes);
    });
  });

  describe('generateDirections', () => {
    it('should return turn-by-turn directions with 200 status', async () => {
      // Mock request params
      mockReq.params = { id: 'route-123' };
      
      // Mock service response
      const mockDirections = [
        [
          {
            distance: 1000,
            duration: 300,
            instructions: 'Head north on Main St',
            polyline: 'step1_polyline',
            startLocation: { latitude: 37.7749, longitude: -122.4194 },
            endLocation: { latitude: 37.7800, longitude: -122.4100 }
          },
          {
            distance: 1000,
            duration: 300,
            instructions: 'Turn right onto Market St',
            polyline: 'step2_polyline',
            startLocation: { latitude: 37.7800, longitude: -122.4100 },
            endLocation: { latitude: 37.7900, longitude: -122.4000 }
          }
        ]
      ];
      mockRouteService.generateTurnByTurnDirections.mockResolvedValue(mockDirections);
      
      // Call the controller method
      await routeController.generateDirections(mockReq as Request, mockRes as Response);
      
      // Verify service was called
      expect(mockRouteService.generateTurnByTurnDirections).toHaveBeenCalledWith('route-123');
      
      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockDirections);
    });

    it('should return 500 if service throws an error', async () => {
      // Mock request params
      mockReq.params = { id: 'route-123' };
      
      // Mock service to throw an error
      const error = new Error('Route not found');
      mockRouteService.generateTurnByTurnDirections.mockRejectedValue(error);
      
      // Call the controller method
      await routeController.generateDirections(mockReq as Request, mockRes as Response);
      
      // Verify service was called
      expect(mockRouteService.generateTurnByTurnDirections).toHaveBeenCalledWith('route-123');
      
      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to generate directions',
        message: 'Route not found'
      });
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two locations with 200 status', async () => {
      // Mock request body
      mockReq.body = {
        origin: { latitude: 37.7749, longitude: -122.4194 },
        destination: { latitude: 37.3352, longitude: -121.8811 }
      };
      
      // Mock service response
      const mockResult = {
        distance: 80000, // 80 km
        duration: 3600 // 1 hour in seconds
      };
      mockRouteService.calculateDistance.mockResolvedValue(mockResult);
      
      // Call the controller method
      await routeController.calculateDistance(mockReq as Request, mockRes as Response);
      
      // Verify service was called with correct parameters
      expect(mockRouteService.calculateDistance).toHaveBeenCalledWith(
        mockReq.body.origin,
        mockReq.body.destination
      );
      
      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 400 if required parameters are missing', async () => {
      // Mock request with missing parameters
      mockReq.body = {
        origin: { latitude: 37.7749, longitude: -122.4194 }
        // Missing destination
      };
      
      // Call the controller method
      await routeController.calculateDistance(mockReq as Request, mockRes as Response);
      
      // Verify service was not called
      expect(mockRouteService.calculateDistance).not.toHaveBeenCalled();
      
      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid request. origin and destination with latitude and longitude are required.'
      });
    });
  });

  // Additional tests for other controller methods...
});
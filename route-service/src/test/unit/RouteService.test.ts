import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import RouteService from '../../services/RouteService';
import MapsService from '../../services/MapsService';
import { RouteRepository } from '../../../../shared/database/repositories/RouteRepository';
import { Route, RouteStatus } from '../../../../shared/types';

// Mock dependencies
jest.mock('../../../../shared/database/repositories/RouteRepository');
jest.mock('../../services/MapsService');
jest.mock('uuid');

describe('RouteService', () => {
  let routeService: RouteService;
  let mockPool: Pool;
  let mockRouteRepository: jest.Mocked<RouteRepository>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock UUID generation
    (uuidv4 as jest.Mock).mockReturnValue('mock-uuid');

    // Create mock pool
    mockPool = {} as Pool;

    // Create the service
    routeService = new RouteService(mockPool);

    // Get the mocked repository instance
    mockRouteRepository = (RouteRepository as jest.MockedClass<typeof RouteRepository>).mock.instances[0] as jest.Mocked<RouteRepository>;
  });

  describe('createRoute', () => {
    it('should create a new route with calculated metrics', async () => {
      // Mock data
      const loadId = 'load-123';
      const vehicleId = 'vehicle-456';
      const stops = [
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
          orderId: 'order-2',
          address: {
            street: '456 Market St',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94105',
            coordinates: { latitude: 37.7900, longitude: -122.4000 }
          },
          sequence: 2,
          estimatedArrival: new Date()
        }
      ];

      // Mock the MapsService methods
      (MapsService.calculateRouteMetrics as jest.Mock).mockResolvedValue({
        totalDistance: 2000,
        estimatedDuration: 600
      });

      (MapsService.calculateEstimatedTravelTimes as jest.Mock).mockResolvedValue([
        { ...stops[0], estimatedArrival: new Date('2023-01-01T12:00:00Z') },
        { ...stops[1], estimatedArrival: new Date('2023-01-01T12:10:00Z') }
      ]);

      // Mock the repository create method
      const mockRoute: Route = {
        id: 'route-789',
        loadId,
        vehicleId,
        stops: [
          { ...stops[0], estimatedArrival: new Date('2023-01-01T12:00:00Z') },
          { ...stops[1], estimatedArrival: new Date('2023-01-01T12:10:00Z') }
        ],
        totalDistance: 2000,
        estimatedDuration: 600,
        status: RouteStatus.PLANNED,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockRouteRepository.create.mockResolvedValue(mockRoute);

      // Call the method
      const result = await routeService.createRoute(loadId, vehicleId, stops);

      // Verify the result
      expect(result).toEqual(mockRoute);

      // Verify MapsService methods were called
      expect(MapsService.calculateRouteMetrics).toHaveBeenCalledWith(stops);
      expect(MapsService.calculateEstimatedTravelTimes).toHaveBeenCalledWith(stops);

      // Verify repository create was called with correct data
      expect(mockRouteRepository.create).toHaveBeenCalledWith({
        loadId,
        vehicleId,
        stops: [
          { ...stops[0], estimatedArrival: new Date('2023-01-01T12:00:00Z') },
          { ...stops[1], estimatedArrival: new Date('2023-01-01T12:10:00Z') }
        ],
        totalDistance: 2000,
        estimatedDuration: 600,
        status: RouteStatus.PLANNED
      });
    });

    it('should handle errors during route creation', async () => {
      // Mock data
      const loadId = 'load-123';
      const vehicleId = 'vehicle-456';
      const stops = [
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
      ];

      // Mock MapsService to throw an error
      (MapsService.calculateRouteMetrics as jest.Mock).mockRejectedValue(new Error('Maps API error'));

      // Call the method and expect it to throw
      await expect(routeService.createRoute(loadId, vehicleId, stops)).rejects.toThrow(
        'Failed to create route: Maps API error'
      );

      // Verify repository create was not called
      expect(mockRouteRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateRouteStops', () => {
    it('should update route stops and recalculate metrics', async () => {
      // Mock data
      const routeId = 'route-123';
      const existingRoute: Route = {
        id: routeId,
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
        ],
        totalDistance: 0,
        estimatedDuration: 0,
        status: RouteStatus.PLANNED,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const newStops = [
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
          orderId: 'order-2',
          address: {
            street: '456 Market St',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94105',
            coordinates: { latitude: 37.7900, longitude: -122.4000 }
          },
          sequence: 2,
          estimatedArrival: new Date()
        }
      ];

      // Mock repository methods
      mockRouteRepository.findById.mockResolvedValue(existingRoute);

      // Mock MapsService methods
      (MapsService.calculateRouteMetrics as jest.Mock).mockResolvedValue({
        totalDistance: 2000,
        estimatedDuration: 600
      });

      (MapsService.calculateEstimatedTravelTimes as jest.Mock).mockResolvedValue([
        { ...newStops[0], estimatedArrival: new Date('2023-01-01T12:00:00Z') },
        { ...newStops[1], estimatedArrival: new Date('2023-01-01T12:10:00Z') }
      ]);

      // Mock repository update methods
      const updatedRoute: Route = {
        ...existingRoute,
        stops: [
          { ...newStops[0], estimatedArrival: new Date('2023-01-01T12:00:00Z') },
          { ...newStops[1], estimatedArrival: new Date('2023-01-01T12:10:00Z') }
        ],
        totalDistance: 2000,
        estimatedDuration: 600
      };
      mockRouteRepository.updateStops.mockResolvedValue(updatedRoute);
      mockRouteRepository.updateRouteMetrics.mockResolvedValue(updatedRoute);

      // Call the method
      const result = await routeService.updateRouteStops(routeId, newStops);

      // Verify the result
      expect(result).toEqual(updatedRoute);

      // Verify repository methods were called
      expect(mockRouteRepository.findById).toHaveBeenCalledWith(routeId);
      expect(mockRouteRepository.updateStops).toHaveBeenCalledWith(
        routeId,
        [
          { ...newStops[0], estimatedArrival: new Date('2023-01-01T12:00:00Z') },
          { ...newStops[1], estimatedArrival: new Date('2023-01-01T12:10:00Z') }
        ]
      );
      expect(mockRouteRepository.updateRouteMetrics).toHaveBeenCalledWith(
        routeId,
        2000,
        600
      );
    });

    it('should return null if route not found', async () => {
      // Mock repository to return null
      mockRouteRepository.findById.mockResolvedValue(null);

      // Call the method
      const result = await routeService.updateRouteStops('non-existent-id', []);

      // Verify the result is null
      expect(result).toBeNull();

      // Verify repository methods
      expect(mockRouteRepository.findById).toHaveBeenCalledWith('non-existent-id');
      expect(mockRouteRepository.updateStops).not.toHaveBeenCalled();
      expect(mockRouteRepository.updateRouteMetrics).not.toHaveBeenCalled();
    });
  });

  describe('generateTurnByTurnDirections', () => {
    it('should generate turn-by-turn directions for a route', async () => {
      // Mock data
      const routeId = 'route-123';
      const route: Route = {
        id: routeId,
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
          },
          {
            orderId: 'order-2',
            address: {
              street: '456 Market St',
              city: 'San Francisco',
              state: 'CA',
              zipCode: '94105',
              coordinates: { latitude: 37.7900, longitude: -122.4000 }
            },
            sequence: 2,
            estimatedArrival: new Date()
          }
        ],
        totalDistance: 2000,
        estimatedDuration: 600,
        status: RouteStatus.PLANNED,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock repository
      mockRouteRepository.findById.mockResolvedValue(route);

      // Mock MapsService
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
      (MapsService.generateTurnByTurnDirections as jest.Mock).mockResolvedValue(mockDirections);

      // Call the method
      const result = await routeService.generateTurnByTurnDirections(routeId);

      // Verify the result
      expect(result).toEqual(mockDirections);

      // Verify repository and MapsService were called
      expect(mockRouteRepository.findById).toHaveBeenCalledWith(routeId);
      expect(MapsService.generateTurnByTurnDirections).toHaveBeenCalledWith(route.stops);
    });

    it('should throw an error if route not found', async () => {
      // Mock repository to return null
      mockRouteRepository.findById.mockResolvedValue(null);

      // Call the method and expect it to throw
      await expect(routeService.generateTurnByTurnDirections('non-existent-id')).rejects.toThrow(
        'Route not found with ID: non-existent-id'
      );

      // Verify repository was called
      expect(mockRouteRepository.findById).toHaveBeenCalledWith('non-existent-id');
      expect(MapsService.generateTurnByTurnDirections).not.toHaveBeenCalled();
    });
  });

  describe('calculateEstimatedTravelTimes', () => {
    it('should calculate estimated travel times for a route', async () => {
      // Mock data
      const routeId = 'route-123';
      const route: Route = {
        id: routeId,
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
          },
          {
            orderId: 'order-2',
            address: {
              street: '456 Market St',
              city: 'San Francisco',
              state: 'CA',
              zipCode: '94105',
              coordinates: { latitude: 37.7900, longitude: -122.4000 }
            },
            sequence: 2,
            estimatedArrival: new Date()
          }
        ],
        totalDistance: 2000,
        estimatedDuration: 600,
        status: RouteStatus.PLANNED,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock repository
      mockRouteRepository.findById.mockResolvedValue(route);

      // Mock MapsService
      const updatedStops = [
        {
          ...route.stops[0],
          estimatedArrival: new Date('2023-01-01T12:00:00Z')
        },
        {
          ...route.stops[1],
          estimatedArrival: new Date('2023-01-01T12:10:00Z')
        }
      ];
      (MapsService.calculateEstimatedTravelTimes as jest.Mock).mockResolvedValue(updatedStops);

      // Mock repository update
      const updatedRoute = {
        ...route,
        stops: updatedStops
      };
      mockRouteRepository.updateStops.mockResolvedValue(updatedRoute);

      // Call the method
      const result = await routeService.calculateEstimatedTravelTimes(routeId);

      // Verify the result
      expect(result).toEqual(updatedRoute);

      // Verify repository and MapsService were called
      expect(mockRouteRepository.findById).toHaveBeenCalledWith(routeId);
      expect(MapsService.calculateEstimatedTravelTimes).toHaveBeenCalledWith(
        route.stops,
        expect.any(Date)
      );
      expect(mockRouteRepository.updateStops).toHaveBeenCalledWith(routeId, updatedStops);
    });

    it('should return null if route not found', async () => {
      // Mock repository to return null
      mockRouteRepository.findById.mockResolvedValue(null);

      // Call the method
      const result = await routeService.calculateEstimatedTravelTimes('non-existent-id');

      // Verify the result is null
      expect(result).toBeNull();

      // Verify repository was called
      expect(mockRouteRepository.findById).toHaveBeenCalledWith('non-existent-id');
      expect(MapsService.calculateEstimatedTravelTimes).not.toHaveBeenCalled();
      expect(mockRouteRepository.updateStops).not.toHaveBeenCalled();
    });
  });

  describe('validateTimeWindows', () => {
    it('should validate time windows for a route', async () => {
      // Mock data
      const routeId = 'route-123';
      const route: Route = {
        id: routeId,
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
            estimatedArrival: new Date('2023-01-01T12:00:00Z')
          },
          {
            orderId: 'order-2',
            address: {
              street: '456 Market St',
              city: 'San Francisco',
              state: 'CA',
              zipCode: '94105',
              coordinates: { latitude: 37.7900, longitude: -122.4000 }
            },
            sequence: 2,
            estimatedArrival: new Date('2023-01-01T13:00:00Z')
          }
        ],
        totalDistance: 2000,
        estimatedDuration: 600,
        status: RouteStatus.PLANNED,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock orders with time windows
      const orders = [
        {
          id: 'order-1',
          timeWindow: {
            startTime: new Date('2023-01-01T11:00:00Z'),
            endTime: new Date('2023-01-01T14:00:00Z')
          }
        },
        {
          id: 'order-2',
          timeWindow: {
            startTime: new Date('2023-01-01T12:30:00Z'),
            endTime: new Date('2023-01-01T15:30:00Z')
          }
        }
      ] as any;

      // Mock repository
      mockRouteRepository.findById.mockResolvedValue(route);

      // Call the method
      const conflicts = await routeService.validateTimeWindows(routeId, orders);

      // Verify the result
      expect(conflicts).toEqual([]);

      // Verify repository was called
      expect(mockRouteRepository.findById).toHaveBeenCalledWith(routeId);
    });

    it('should detect time window conflicts', async () => {
      // Mock data
      const routeId = 'route-123';
      const route: Route = {
        id: routeId,
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
            estimatedArrival: new Date('2023-01-01T10:00:00Z') // Before time window starts
          },
          {
            orderId: 'order-2',
            address: {
              street: '456 Market St',
              city: 'San Francisco',
              state: 'CA',
              zipCode: '94105',
              coordinates: { latitude: 37.7900, longitude: -122.4000 }
            },
            sequence: 2,
            estimatedArrival: new Date('2023-01-01T16:00:00Z') // After time window ends
          }
        ],
        totalDistance: 2000,
        estimatedDuration: 600,
        status: RouteStatus.PLANNED,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock orders with time windows
      const orders = [
        {
          id: 'order-1',
          timeWindow: {
            startTime: new Date('2023-01-01T11:00:00Z'),
            endTime: new Date('2023-01-01T14:00:00Z')
          }
        },
        {
          id: 'order-2',
          timeWindow: {
            startTime: new Date('2023-01-01T12:30:00Z'),
            endTime: new Date('2023-01-01T15:30:00Z')
          }
        }
      ] as any;

      // Mock repository
      mockRouteRepository.findById.mockResolvedValue(route);

      // Call the method
      const conflicts = await routeService.validateTimeWindows(routeId, orders);

      // Verify the result
      expect(conflicts).not.toBeNull(); // First check that conflicts is not null
      if (conflicts) { // TypeScript null check
        expect(conflicts.length).toBe(2);
        expect(conflicts[0]).toContain('order-1');
        expect(conflicts[0]).toContain('before the time window');
        expect(conflicts[1]).toContain('order-2');
        expect(conflicts[1]).toContain('after the time window');
      } else {
        fail('Expected conflicts to be an array but got null');
      }

      // Verify repository was called
      expect(mockRouteRepository.findById).toHaveBeenCalledWith(routeId);
    });

    it('should return null if route not found', async () => {
      // Mock repository to return null
      mockRouteRepository.findById.mockResolvedValue(null);

      // Call the method
      const conflicts = await routeService.validateTimeWindows('non-existent-id', []);

      // Verify the result is null
      expect(conflicts).toBeNull();

      // Verify repository was called
      expect(mockRouteRepository.findById).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('optimizeRouteSequence', () => {
    it('should optimize the sequence of stops in a route', async () => {
      // Mock data
      const routeId = 'route-123';
      const route: Route = {
        id: routeId,
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
            estimatedArrival: new Date('2023-01-01T12:00:00Z')
          },
          {
            orderId: 'order-2',
            address: {
              street: '456 Market St',
              city: 'San Francisco',
              state: 'CA',
              zipCode: '94105',
              coordinates: { latitude: 37.7900, longitude: -122.4000 }
            },
            sequence: 2,
            estimatedArrival: new Date('2023-01-01T13:00:00Z')
          }
        ],
        totalDistance: 2000,
        estimatedDuration: 600,
        status: RouteStatus.PLANNED,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock orders with time windows
      const orders = [
        {
          id: 'order-1',
          timeWindow: {
            startTime: new Date('2023-01-01T13:00:00Z'), // Later time window
            endTime: new Date('2023-01-01T16:00:00Z')
          }
        },
        {
          id: 'order-2',
          timeWindow: {
            startTime: new Date('2023-01-01T11:00:00Z'), // Earlier time window
            endTime: new Date('2023-01-01T14:00:00Z')
          }
        }
      ] as any;

      // Mock repository
      mockRouteRepository.findById.mockResolvedValue(route);

      // Mock optimized stops (swapped sequence)
      const optimizedStops = [
        {
          ...route.stops[1],
          sequence: 1
        },
        {
          ...route.stops[0],
          sequence: 2
        }
      ];

      // Mock MapsService
      (MapsService.calculateRouteMetrics as jest.Mock).mockResolvedValue({
        totalDistance: 1800, // Shorter distance
        estimatedDuration: 540  // Shorter duration
      });

      (MapsService.calculateEstimatedTravelTimes as jest.Mock).mockResolvedValue(optimizedStops);

      // Mock repository updates
      const updatedRoute = {
        ...route,
        stops: optimizedStops,
        totalDistance: 1800,
        estimatedDuration: 540
      };
      mockRouteRepository.updateStops.mockResolvedValue(updatedRoute);
      mockRouteRepository.updateRouteMetrics.mockResolvedValue(updatedRoute);

      // Call the method
      const result = await routeService.optimizeRouteSequence(routeId, orders);

      // Verify the result
      expect(result).toEqual(updatedRoute);

      // Verify repository methods were called
      expect(mockRouteRepository.findById).toHaveBeenCalledWith(routeId);
      expect(mockRouteRepository.updateStops).toHaveBeenCalledWith(routeId, optimizedStops);
      expect(mockRouteRepository.updateRouteMetrics).toHaveBeenCalledWith(
        routeId,
        1800,
        540
      );
    });

    it('should return null if route not found', async () => {
      // Mock repository to return null
      mockRouteRepository.findById.mockResolvedValue(null);

      // Call the method
      const result = await routeService.optimizeRouteSequence('non-existent-id', []);

      // Verify the result is null
      expect(result).toBeNull();

      // Verify repository was called
      expect(mockRouteRepository.findById).toHaveBeenCalledWith('non-existent-id');
      expect(mockRouteRepository.updateStops).not.toHaveBeenCalled();
      expect(mockRouteRepository.updateRouteMetrics).not.toHaveBeenCalled();
    });
  });

  describe('detectTimeWindowConflicts', () => {
    it('should detect conflicts between estimated arrival times and time windows', async () => {
      // Mock data
      const routeId = 'route-123';
      const route: Route = {
        id: routeId,
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
            estimatedArrival: new Date('2023-01-01T10:00:00Z') // Before time window starts
          }
        ],
        totalDistance: 2000,
        estimatedDuration: 600,
        status: RouteStatus.PLANNED,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock orders with time windows
      const orders = [
        {
          id: 'order-1',
          timeWindow: {
            startTime: new Date('2023-01-01T11:00:00Z'),
            endTime: new Date('2023-01-01T14:00:00Z')
          }
        }
      ] as any;

      // Mock repository
      mockRouteRepository.findById.mockResolvedValue(route);

      // Call the method
      const conflicts = await routeService.detectTimeWindowConflicts(routeId, orders);

      // Verify the result
      expect(conflicts).not.toBeNull(); // First check that conflicts is not null
      if (conflicts) { // TypeScript null check
        expect(conflicts.length).toBe(1);
        expect(conflicts[0]).toContain('order-1');
        expect(conflicts[0]).toContain('before the time window');
      } else {
        fail('Expected conflicts to be an array but got null');
      }

      // Verify repository was called
      expect(mockRouteRepository.findById).toHaveBeenCalledWith(routeId);
    });

    it('should return empty array when no conflicts exist', async () => {
      // Mock data
      const routeId = 'route-123';
      const route: Route = {
        id: routeId,
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
            estimatedArrival: new Date('2023-01-01T12:00:00Z') // Within time window
          }
        ],
        totalDistance: 2000,
        estimatedDuration: 600,
        status: RouteStatus.PLANNED,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock orders with time windows
      const orders = [
        {
          id: 'order-1',
          timeWindow: {
            startTime: new Date('2023-01-01T11:00:00Z'),
            endTime: new Date('2023-01-01T14:00:00Z')
          }
        }
      ] as any;

      // Mock repository
      mockRouteRepository.findById.mockResolvedValue(route);

      // Call the method
      const conflicts = await routeService.detectTimeWindowConflicts(routeId, orders);

      // Verify the result
      expect(conflicts).toEqual([]);

      // Verify repository was called
      expect(mockRouteRepository.findById).toHaveBeenCalledWith(routeId);
    });

    it('should return null if route not found', async () => {
      // Mock repository to return null
      mockRouteRepository.findById.mockResolvedValue(null);

      // Call the method
      const conflicts = await routeService.detectTimeWindowConflicts('non-existent-id', []);

      // Verify the result is null
      expect(conflicts).toBeNull();

      // Verify repository was called
      expect(mockRouteRepository.findById).toHaveBeenCalledWith('non-existent-id');
    });
  });
});
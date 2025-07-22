import { Pool } from 'pg';
import RouteService from '../../services/RouteService';
import MapsService from '../../services/MapsService';
import { RouteRepository } from '../../../../shared/database/repositories/RouteRepository';
import { Route, RouteStatus } from '../../../../shared/types';

// Mock dependencies
jest.mock('../../../../shared/database/repositories/RouteRepository');
jest.mock('../../services/MapsService');

describe('Route Manual Planning Service', () => {
  let routeService: RouteService;
  let mockPool: Pool;
  let mockRouteRepository: jest.Mocked<RouteRepository>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock pool
    mockPool = {} as Pool;

    // Create the service
    routeService = new RouteService(mockPool);

    // Get the mocked repository instance
    mockRouteRepository = (RouteRepository as jest.MockedClass<typeof RouteRepository>).mock.instances[0] as jest.Mocked<RouteRepository>;
  });

  describe('generateRouteMapData', () => {
    it('should generate map data for a route with multiple stops', async () => {
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
            sequence: 0,
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
            sequence: 1,
            estimatedArrival: new Date('2023-01-01T12:30:00Z')
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
            estimatedArrival: new Date('2023-01-01T13:00:00Z')
          }
        ],
        totalDistance: 3000,
        estimatedDuration: 900,
        status: RouteStatus.PLANNED,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock repository
      mockRouteRepository.findById.mockResolvedValue(route);

      // Mock MapsService
      (MapsService.getDirections as jest.Mock).mockResolvedValue({
        distance: 3000,
        duration: 900,
        polyline: 'encoded_polyline_string',
        steps: []
      });

      // Call the method
      const result = await routeService.generateRouteMapData(routeId);

      // Verify the result
      expect(result).toEqual({
        polyline: 'encoded_polyline_string',
        waypoints: [
          {
            location: { latitude: 37.7749, longitude: -122.4194 },
            orderId: 'order-1',
            sequence: 0,
            estimatedArrival: new Date('2023-01-01T12:00:00Z')
          },
          {
            location: { latitude: 37.7900, longitude: -122.4000 },
            orderId: 'order-2',
            sequence: 1,
            estimatedArrival: new Date('2023-01-01T12:30:00Z')
          },
          {
            location: { latitude: 37.7850, longitude: -122.4050 },
            orderId: 'order-3',
            sequence: 2,
            estimatedArrival: new Date('2023-01-01T13:00:00Z')
          }
        ]
      });

      // Verify repository and MapsService were called
      expect(mockRouteRepository.findById).toHaveBeenCalledWith(routeId);
      expect(MapsService.getDirections).toHaveBeenCalledWith(
        { latitude: 37.7749, longitude: -122.4194 },
        { latitude: 37.7850, longitude: -122.4050 },
        [{ latitude: 37.7900, longitude: -122.4000 }]
      );
    });

    it('should handle routes with a single stop', async () => {
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
            sequence: 0,
            estimatedArrival: new Date('2023-01-01T12:00:00Z')
          }
        ],
        totalDistance: 0,
        estimatedDuration: 0,
        status: RouteStatus.PLANNED,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock repository
      mockRouteRepository.findById.mockResolvedValue(route);

      // Call the method
      const result = await routeService.generateRouteMapData(routeId);

      // Verify the result
      expect(result).toEqual({
        polyline: '',
        waypoints: [
          {
            location: { latitude: 37.7749, longitude: -122.4194 },
            orderId: 'order-1',
            sequence: 0,
            estimatedArrival: new Date('2023-01-01T12:00:00Z')
          }
        ]
      });

      // Verify repository was called and MapsService was not called
      expect(mockRouteRepository.findById).toHaveBeenCalledWith(routeId);
      expect(MapsService.getDirections).not.toHaveBeenCalled();
    });

    it('should throw an error if route not found', async () => {
      // Mock repository to return null
      mockRouteRepository.findById.mockResolvedValue(null);

      // Call the method and expect it to throw
      await expect(routeService.generateRouteMapData('non-existent-id')).rejects.toThrow(
        'Route not found with ID: non-existent-id'
      );

      // Verify repository was called
      expect(mockRouteRepository.findById).toHaveBeenCalledWith('non-existent-id');
    });

    it('should handle errors from Maps API gracefully', async () => {
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
            sequence: 0,
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
            sequence: 1,
            estimatedArrival: new Date('2023-01-01T12:30:00Z')
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

      // Mock MapsService to throw an error
      (MapsService.getDirections as jest.Mock).mockRejectedValue(new Error('Maps API error'));

      // Call the method
      const result = await routeService.generateRouteMapData(routeId);

      // Verify the result still has waypoints but empty polyline
      expect(result).toEqual({
        polyline: '',
        waypoints: [
          {
            location: { latitude: 37.7749, longitude: -122.4194 },
            orderId: 'order-1',
            sequence: 0,
            estimatedArrival: new Date('2023-01-01T12:00:00Z')
          },
          {
            location: { latitude: 37.7900, longitude: -122.4000 },
            orderId: 'order-2',
            sequence: 1,
            estimatedArrival: new Date('2023-01-01T12:30:00Z')
          }
        ]
      });

      // Verify repository and MapsService were called
      expect(mockRouteRepository.findById).toHaveBeenCalledWith(routeId);
      expect(MapsService.getDirections).toHaveBeenCalled();
    });
  });

  describe('reorderRouteStops', () => {
    it('should reorder stops based on provided order of orderIds', async () => {
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
            sequence: 0,
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
            sequence: 1,
            estimatedArrival: new Date('2023-01-01T12:30:00Z')
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
            estimatedArrival: new Date('2023-01-01T13:00:00Z')
          }
        ],
        totalDistance: 3000,
        estimatedDuration: 900,
        status: RouteStatus.PLANNED,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // New order of stops
      const stopOrder = ['order-2', 'order-3', 'order-1'];

      // Mock repository
      mockRouteRepository.findById.mockResolvedValue(route);

      // Expected reordered stops
      const reorderedStops = [
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
          estimatedArrival: new Date('2023-01-01T12:30:00Z')
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
          sequence: 1,
          estimatedArrival: new Date('2023-01-01T13:00:00Z')
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
          sequence: 2,
          estimatedArrival: new Date('2023-01-01T12:00:00Z')
        }
      ];

      // Mock updateRouteStops method
      const updatedRoute = {
        ...route,
        stops: reorderedStops,
        totalDistance: 3500, // Different distance due to new order
        estimatedDuration: 1000 // Different duration due to new order
      };
      
      // Spy on updateRouteStops method
      const updateRouteStopsSpy = jest.spyOn(routeService, 'updateRouteStops')
        .mockResolvedValue(updatedRoute);

      // Call the method
      const result = await routeService.reorderRouteStops(routeId, stopOrder);

      // Verify the result
      expect(result).toEqual(updatedRoute);

      // Verify repository and updateRouteStops were called
      expect(mockRouteRepository.findById).toHaveBeenCalledWith(routeId);
      expect(updateRouteStopsSpy).toHaveBeenCalledWith(routeId, expect.arrayContaining([
        expect.objectContaining({ orderId: 'order-2', sequence: 0 }),
        expect.objectContaining({ orderId: 'order-3', sequence: 1 }),
        expect.objectContaining({ orderId: 'order-1', sequence: 2 })
      ]));
    });

    it('should return null if route not found', async () => {
      // Mock repository to return null
      mockRouteRepository.findById.mockResolvedValue(null);

      // Call the method
      const result = await routeService.reorderRouteStops('non-existent-id', ['order-1', 'order-2']);

      // Verify the result is null
      expect(result).toBeNull();

      // Verify repository was called
      expect(mockRouteRepository.findById).toHaveBeenCalledWith('non-existent-id');
    });

    it('should throw an error if stopOrder contains invalid orderIds', async () => {
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
            sequence: 0,
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
            sequence: 1,
            estimatedArrival: new Date('2023-01-01T12:30:00Z')
          }
        ],
        totalDistance: 2000,
        estimatedDuration: 600,
        status: RouteStatus.PLANNED,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Invalid order with non-existent orderId
      const stopOrder = ['order-1', 'order-2', 'non-existent-order'];

      // Mock repository
      mockRouteRepository.findById.mockResolvedValue(route);

      // Call the method and expect it to throw
      await expect(routeService.reorderRouteStops(routeId, stopOrder)).rejects.toThrow(
        'Invalid stop order: contains orderIds that do not exist in the route'
      );

      // Verify repository was called
      expect(mockRouteRepository.findById).toHaveBeenCalledWith(routeId);
    });
  });
});
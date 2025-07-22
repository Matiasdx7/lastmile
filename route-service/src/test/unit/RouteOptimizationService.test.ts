import { RouteOptimizationService } from '../../services/RouteOptimizationService';
import { MapService } from '../../services/MapService';
import { Order, Vehicle, Route, RouteStatus } from '../../../../shared/types';
import { Location } from '../../../../shared/types/common/Location';

// Create an interface that extends MapService with the missing method
interface ExtendedMapService extends MapService {
  getDirections(waypoints: Location[]): Promise<any>;
}

// Mock dependencies
jest.mock('../../services/MapService');

describe('RouteOptimizationService', () => {
  let routeOptimizationService: RouteOptimizationService;
  let mockMapService: jest.Mocked<ExtendedMapService>;
  
  // Mock data
  const mockOrders: Order[] = [
    {
      id: 'order1',
      customerId: 'customer1',
      customerName: 'John Doe',
      customerPhone: '123-456-7890',
      deliveryAddress: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        coordinates: { latitude: 37.7749, longitude: -122.4194 }
      },
      packageDetails: [
        {
          id: 'pkg1',
          description: 'Small package',
          weight: 5,
          dimensions: { length: 20, width: 15, height: 10 },
          fragile: false
        }
      ],
      status: 'pending' as any,
      createdAt: new Date('2023-01-01T10:00:00Z'),
      updatedAt: new Date('2023-01-01T10:00:00Z')
    },
    {
      id: 'order2',
      customerId: 'customer2',
      customerName: 'Jane Smith',
      customerPhone: '987-654-3210',
      deliveryAddress: {
        street: '456 Oak St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        coordinates: { latitude: 37.7750, longitude: -122.4195 }
      },
      packageDetails: [
        {
          id: 'pkg2',
          description: 'Medium package',
          weight: 10,
          dimensions: { length: 30, width: 25, height: 20 },
          fragile: false
        }
      ],
      timeWindow: {
        startTime: new Date('2023-01-01T13:00:00Z'),
        endTime: new Date('2023-01-01T15:00:00Z')
      },
      status: 'pending' as any,
      createdAt: new Date('2023-01-01T10:30:00Z'),
      updatedAt: new Date('2023-01-01T10:30:00Z')
    },
    {
      id: 'order3',
      customerId: 'customer3',
      customerName: 'Bob Johnson',
      customerPhone: '555-123-4567',
      deliveryAddress: {
        street: '789 Pine St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        coordinates: { latitude: 37.7751, longitude: -122.4196 }
      },
      packageDetails: [
        {
          id: 'pkg3',
          description: 'Large package',
          weight: 20,
          dimensions: { length: 50, width: 40, height: 30 },
          fragile: true
        }
      ],
      timeWindow: {
        startTime: new Date('2023-01-01T14:00:00Z'),
        endTime: new Date('2023-01-01T16:00:00Z')
      },
      status: 'pending' as any,
      createdAt: new Date('2023-01-01T11:00:00Z'),
      updatedAt: new Date('2023-01-01T11:00:00Z')
    }
  ];
  
  const mockVehicles: Vehicle[] = [
    {
      id: 'vehicle1',
      licensePlate: 'ABC123',
      type: 'van' as any,
      capacity: {
        maxWeight: 1000,
        maxVolume: 10,
        maxPackages: 50
      },
      currentLocation: { latitude: 37.7749, longitude: -122.4194 },
      status: 'available' as any,
      createdAt: new Date('2023-01-01T09:00:00Z'),
      updatedAt: new Date('2023-01-01T09:00:00Z')
    }
  ];
  
  const mockDepot = { latitude: 37.7749, longitude: -122.4194 };
  
  const mockDistanceMatrix = [
    [0, 1, 2, 3],
    [1, 0, 1, 2],
    [2, 1, 0, 1],
    [3, 2, 1, 0]
  ];
  
  const mockRoute: Route = {
    id: 'route1',
    loadId: 'load1',
    vehicleId: 'vehicle1',
    stops: [
      {
        orderId: 'order1',
        address: mockOrders[0].deliveryAddress,
        sequence: 0,
        estimatedArrival: new Date('2023-01-01T12:00:00Z')
      },
      {
        orderId: 'order2',
        address: mockOrders[1].deliveryAddress,
        sequence: 1,
        estimatedArrival: new Date('2023-01-01T12:30:00Z')
      }
    ],
    totalDistance: 10,
    estimatedDuration: 30,
    status: RouteStatus.PLANNED,
    createdAt: new Date('2023-01-01T11:00:00Z'),
    updatedAt: new Date('2023-01-01T11:00:00Z')
  };
  
  beforeEach(() => {
    mockMapService = new MapService('fake-api-key') as jest.Mocked<ExtendedMapService>;
    routeOptimizationService = new RouteOptimizationService(mockMapService);
    
    // Mock MapService methods
    mockMapService.calculateDistanceMatrix = jest.fn().mockResolvedValue(mockDistanceMatrix);
    mockMapService.getDirections = jest.fn().mockResolvedValue({ routes: [{ legs: [] }] });
    mockMapService.calculateTravelTime = jest.fn().mockResolvedValue(15);
  });
  
  describe('optimizeRoutes', () => {
    it('should optimize routes for a set of orders and vehicles', async () => {
      const routes = await routeOptimizationService.optimizeRoutes(
        mockOrders,
        mockVehicles,
        mockDepot
      );
      
      expect(mockMapService.calculateDistanceMatrix).toHaveBeenCalled();
      expect(routes).toBeDefined();
      expect(routes.length).toBeGreaterThan(0);
      
      // Check that each route has the expected properties
      routes.forEach(route => {
        expect(route.id).toBeDefined();
        expect(route.vehicleId).toBe(mockVehicles[0].id);
        expect(route.stops).toBeDefined();
        expect(route.totalDistance).toBeGreaterThan(0);
        expect(route.estimatedDuration).toBeGreaterThan(0);
        expect(route.status).toBe(RouteStatus.PLANNED);
      });
    });
    
    it('should handle empty orders array', async () => {
      mockMapService.calculateDistanceMatrix = jest.fn().mockResolvedValue([]);
      
      const routes = await routeOptimizationService.optimizeRoutes(
        [],
        mockVehicles,
        mockDepot
      );
      
      expect(routes).toBeDefined();
      expect(routes.length).toBe(0);
    });
  });
  
  describe('validateRouteTimeWindows', () => {
    it('should detect no conflicts when all stops are within time windows', async () => {
      const conflicts = await routeOptimizationService.validateRouteTimeWindows(
        mockRoute,
        mockOrders
      );
      
      expect(conflicts).toBeDefined();
      expect(conflicts.length).toBe(0);
    });
    
    it('should detect conflicts when stops are outside time windows', async () => {
      // Create a route with a stop that has an arrival time outside its time window
      const conflictRoute: Route = {
        ...mockRoute,
        stops: [
          {
            orderId: 'order2',
            address: mockOrders[1].deliveryAddress,
            sequence: 0,
            estimatedArrival: new Date('2023-01-01T16:30:00Z') // After the time window ends
          }
        ]
      };
      
      const conflicts = await routeOptimizationService.validateRouteTimeWindows(
        conflictRoute,
        mockOrders
      );
      
      expect(conflicts).toBeDefined();
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0]).toContain('time window');
    });
  });
  
  describe('generateTurnByTurnDirections', () => {
    it('should generate turn-by-turn directions for a route', async () => {
      const directions = await routeOptimizationService.generateTurnByTurnDirections(mockRoute);
      
      expect(mockMapService.getDirections).toHaveBeenCalled();
      expect(directions).toBeDefined();
      expect(directions).toHaveProperty('routes');
    });
  });
  
  describe('suggestAlternativeRoutes', () => {
    it('should suggest alternative routes when conflicts are detected', async () => {
      const alternatives = await routeOptimizationService.suggestAlternativeRoutes(
        mockRoute,
        mockOrders,
        mockVehicles
      );
      
      expect(alternatives).toBeDefined();
      expect(alternatives.length).toBeGreaterThan(0);
      
      // Check that alternatives have different stop sequences
      alternatives.forEach(route => {
        expect(route.id).not.toBe(mockRoute.id);
        expect(route.stops.length).toBe(mockRoute.stops.length);
      });
    });
  });
});
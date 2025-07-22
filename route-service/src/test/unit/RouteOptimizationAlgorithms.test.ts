import { RouteOptimizationService } from '../../services/RouteOptimizationService';
import { MapService } from '../../services/MapService';
import { Order, Vehicle, Route, RouteStatus, RouteStop } from '../../../../shared/types';

// Mock dependencies
jest.mock('../../services/MapService');

describe('Route Optimization Algorithms', () => {
  let routeOptimizationService: RouteOptimizationService;
  let mockMapService: jest.Mocked<MapService>;
  
  // Mock data for testing
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
  
  beforeEach(() => {
    mockMapService = new MapService('fake-api-key') as jest.Mocked<MapService>;
    routeOptimizationService = new RouteOptimizationService(mockMapService);
  });
  
  describe('Clarke-Wright Savings Algorithm', () => {
    it('should correctly calculate savings and merge routes', async () => {
      // Create a specific distance matrix that will test the savings algorithm
      // The matrix is designed so that combining stops 1 and 2 has the highest savings
      const mockDistanceMatrix = [
        [0, 10, 10, 10], // Depot to all points = 10
        [10, 0, 5, 15],  // Point 1 to others
        [10, 5, 0, 15],  // Point 2 to others
        [10, 15, 15, 0]  // Point 3 to others
      ];
      
      mockMapService.calculateDistanceMatrix = jest.fn().mockResolvedValue(mockDistanceMatrix);
      
      const routes = await routeOptimizationService.optimizeRoutes(
        mockOrders,
        mockVehicles,
        mockDepot
      );
      
      expect(routes).toBeDefined();
      expect(routes.length).toBe(1); // Should create one route for all orders
      
      // Check that the route contains all orders
      const orderIds = routes[0].stops.map(stop => stop.orderId);
      expect(orderIds).toContain('order1');
      expect(orderIds).toContain('order2');
      expect(orderIds).toContain('order3');
      
      // Check that points 1 and 2 are adjacent in the route due to high savings
      const order1Index = orderIds.indexOf('order1');
      const order2Index = orderIds.indexOf('order2');
      expect(Math.abs(order1Index - order2Index)).toBe(1);
    });
    
    it('should respect vehicle capacity constraints', async () => {
      // Create orders with large packages that exceed vehicle capacity
      const heavyOrders = mockOrders.map((order, index) => ({
        ...order,
        packageDetails: [{
          id: `pkg${index + 1}`,
          description: 'Heavy package',
          weight: 400, // Each package is 400 units
          dimensions: { length: 50, width: 40, height: 30 },
          fragile: false
        }]
      }));
      
      // Vehicle with limited capacity
      const limitedVehicle: Vehicle[] = [{
        ...mockVehicles[0],
        capacity: {
          maxWeight: 800, // Can only fit 2 packages
          maxVolume: 10,
          maxPackages: 50
        }
      }];
      
      mockMapService.calculateDistanceMatrix = jest.fn().mockResolvedValue([
        [0, 10, 10, 10],
        [10, 0, 5, 15],
        [10, 5, 0, 15],
        [10, 15, 15, 0]
      ]);
      
      const routes = await routeOptimizationService.optimizeRoutes(
        heavyOrders,
        limitedVehicle,
        mockDepot
      );
      
      expect(routes).toBeDefined();
      expect(routes.length).toBeGreaterThan(1); // Should create multiple routes due to capacity constraints
      
      // Check that each route respects the vehicle capacity
      routes.forEach(route => {
        const totalWeight = route.stops.reduce((sum, stop) => {
          const order = heavyOrders.find(o => o.id === stop.orderId);
          return sum + order!.packageDetails.reduce((w, pkg) => w + pkg.weight, 0);
        }, 0);
        
        expect(totalWeight).toBeLessThanOrEqual(limitedVehicle[0].capacity.maxWeight);
      });
    });
  });
  
  describe('Time Window Validation', () => {
    it('should detect time window conflicts accurately', async () => {
      // Create a route with stops that have conflicting time windows
      const conflictRoute: Route = {
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
            // This arrival time is after the time window ends
            estimatedArrival: new Date('2023-01-01T16:30:00Z')
          }
        ],
        totalDistance: 10,
        estimatedDuration: 30,
        status: RouteStatus.PLANNED,
        createdAt: new Date('2023-01-01T11:00:00Z'),
        updatedAt: new Date('2023-01-01T11:00:00Z')
      };
      
      // Mock the calculateEstimatedArrivalTimes method
      jest.spyOn(routeOptimizationService as any, 'calculateEstimatedArrivalTimes')
        .mockResolvedValue([
          new Date('2023-01-01T12:00:00Z'),
          new Date('2023-01-01T16:30:00Z') // After order2's time window ends at 15:00
        ]);
      
      const conflicts = await routeOptimizationService.validateRouteTimeWindows(
        conflictRoute,
        mockOrders
      );
      
      expect(conflicts).toBeDefined();
      expect(conflicts.length).toBe(1);
      expect(conflicts[0]).toContain('after the time window ends');
    });
    
    it('should detect early arrival conflicts', async () => {
      // Create a route with a stop that arrives before the time window starts
      const earlyRoute: Route = {
        id: 'route1',
        loadId: 'load1',
        vehicleId: 'vehicle1',
        stops: [
          {
            orderId: 'order3',
            address: mockOrders[2].deliveryAddress,
            sequence: 0,
            // This arrival time is before the time window starts
            estimatedArrival: new Date('2023-01-01T13:30:00Z')
          }
        ],
        totalDistance: 10,
        estimatedDuration: 30,
        status: RouteStatus.PLANNED,
        createdAt: new Date('2023-01-01T11:00:00Z'),
        updatedAt: new Date('2023-01-01T11:00:00Z')
      };
      
      // Mock the calculateEstimatedArrivalTimes method
      jest.spyOn(routeOptimizationService as any, 'calculateEstimatedArrivalTimes')
        .mockResolvedValue([
          new Date('2023-01-01T13:30:00Z') // Before order3's time window starts at 14:00
        ]);
      
      const conflicts = await routeOptimizationService.validateRouteTimeWindows(
        earlyRoute,
        mockOrders
      );
      
      expect(conflicts).toBeDefined();
      expect(conflicts.length).toBe(1);
      expect(conflicts[0]).toContain('before the time window starts');
    });
    
    it('should not report conflicts when all stops are within time windows', async () => {
      // Create a route with stops that are all within their time windows
      const goodRoute: Route = {
        id: 'route1',
        loadId: 'load1',
        vehicleId: 'vehicle1',
        stops: [
          {
            orderId: 'order2',
            address: mockOrders[1].deliveryAddress,
            sequence: 0,
            estimatedArrival: new Date('2023-01-01T14:00:00Z') // Within 13:00-15:00
          },
          {
            orderId: 'order3',
            address: mockOrders[2].deliveryAddress,
            sequence: 1,
            estimatedArrival: new Date('2023-01-01T15:00:00Z') // Within 14:00-16:00
          }
        ],
        totalDistance: 10,
        estimatedDuration: 30,
        status: RouteStatus.PLANNED,
        createdAt: new Date('2023-01-01T11:00:00Z'),
        updatedAt: new Date('2023-01-01T11:00:00Z')
      };
      
      // Mock the calculateEstimatedArrivalTimes method
      jest.spyOn(routeOptimizationService as any, 'calculateEstimatedArrivalTimes')
        .mockResolvedValue([
          new Date('2023-01-01T14:00:00Z'),
          new Date('2023-01-01T15:00:00Z')
        ]);
      
      const conflicts = await routeOptimizationService.validateRouteTimeWindows(
        goodRoute,
        mockOrders
      );
      
      expect(conflicts).toBeDefined();
      expect(conflicts.length).toBe(0);
    });
  });
  
  describe('Alternative Route Generation', () => {
    it('should generate alternative routes with different stop sequences', async () => {
      const originalRoute: Route = {
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
            estimatedArrival: new Date('2023-01-01T13:00:00Z')
          },
          {
            orderId: 'order3',
            address: mockOrders[2].deliveryAddress,
            sequence: 2,
            estimatedArrival: new Date('2023-01-01T14:00:00Z')
          }
        ],
        totalDistance: 15,
        estimatedDuration: 45,
        status: RouteStatus.PLANNED,
        createdAt: new Date('2023-01-01T11:00:00Z'),
        updatedAt: new Date('2023-01-01T11:00:00Z')
      };
      
      const alternatives = await routeOptimizationService.suggestAlternativeRoutes(
        originalRoute,
        mockOrders,
        mockVehicles
      );
      
      expect(alternatives).toBeDefined();
      expect(alternatives.length).toBeGreaterThan(0);
      
      // Check that alternatives have different IDs and stop sequences
      alternatives.forEach(route => {
        expect(route.id).not.toBe(originalRoute.id);
        
        // Check that the stop sequence is different
        const originalSequence = originalRoute.stops.map(stop => stop.orderId).join(',');
        const alternativeSequence = route.stops.map(stop => stop.orderId).join(',');
        
        expect(alternativeSequence).not.toBe(originalSequence);
      });
    });
    
    it('should handle routes with few stops appropriately', async () => {
      // Create a route with only 2 stops
      const shortRoute: Route = {
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
            estimatedArrival: new Date('2023-01-01T13:00:00Z')
          }
        ],
        totalDistance: 10,
        estimatedDuration: 30,
        status: RouteStatus.PLANNED,
        createdAt: new Date('2023-01-01T11:00:00Z'),
        updatedAt: new Date('2023-01-01T11:00:00Z')
      };
      
      const alternatives = await routeOptimizationService.suggestAlternativeRoutes(
        shortRoute,
        mockOrders,
        mockVehicles
      );
      
      expect(alternatives).toBeDefined();
      expect(alternatives.length).toBeGreaterThan(0);
      
      // For a 2-stop route, the only alternative is to reverse the order
      const originalSequence = shortRoute.stops.map(stop => stop.orderId).join(',');
      const alternativeSequence = alternatives[0].stops.map(stop => stop.orderId).join(',');
      
      expect(alternativeSequence).not.toBe(originalSequence);
      expect(alternativeSequence.split(',').reverse().join(',')).toBe(originalSequence);
    });
  });
});
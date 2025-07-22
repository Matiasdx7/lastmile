import { RouteService } from '../../services/RouteService';
import { Pool } from 'pg';
import { RouteRepository } from '../../../../shared/database/repositories/RouteRepository';
import MapsService from '../../services/MapsService';
import { Route, RouteStatus, Order } from '../../../../shared/types';

// Mock the Google Maps client to avoid TypeScript errors
jest.mock('@googlemaps/google-maps-services-js', () => {
  return {
    Client: jest.fn().mockImplementation(() => {
      return {
        geocode: jest.fn(),
        directions: jest.fn(),
        distancematrix: jest.fn()
      };
    }),
    TravelMode: {
      driving: 'driving'
    },
    UnitSystem: {
      metric: 'metric'
    }
  };
}, { virtual: true });

// Mock dependencies
jest.mock('../../../../shared/database/repositories/RouteRepository');
jest.mock('../../services/MapsService');
jest.mock('uuid');

describe('Route Time Window Validation', () => {
  let routeService: RouteService;
  let mockPool: Pool;
  let mockRouteRepository: jest.Mocked<RouteRepository>;
  
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
        estimatedArrival: new Date('2023-01-01T13:30:00Z')
      },
      {
        orderId: 'order3',
        address: mockOrders[2].deliveryAddress,
        sequence: 2,
        estimatedArrival: new Date('2023-01-01T15:00:00Z')
      }
    ],
    totalDistance: 15,
    estimatedDuration: 45,
    status: RouteStatus.PLANNED,
    createdAt: new Date('2023-01-01T11:00:00Z'),
    updatedAt: new Date('2023-01-01T11:00:00Z')
  };
  
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
  
  describe('validateTimeWindows', () => {
    it('should detect no conflicts when all stops are within time windows', async () => {
      // Mock repository to return the route
      mockRouteRepository.findById.mockResolvedValue(mockRoute);
      
      // Mock the order repository or service to return orders
      // This is a simplified test that directly passes the orders
      
      const conflicts = await routeService.validateTimeWindows('route1', mockOrders);
      
      expect(conflicts).not.toBeNull(); // First check that conflicts is not null
      if (conflicts) { // TypeScript null check
        expect(conflicts.length).toBe(0);
      } else {
        fail('Expected conflicts to be an array but got null');
      }
    });
    
    it('should detect conflicts when stops are outside time windows', async () => {
      // Create a route with a stop that has an arrival time outside its time window
      const conflictRoute: Route = {
        ...mockRoute,
        stops: [
          mockRoute.stops[0],
          {
            ...mockRoute.stops[1],
            estimatedArrival: new Date('2023-01-01T16:00:00Z') // After the time window ends at 15:00
          },
          mockRoute.stops[2]
        ]
      };
      
      // Mock repository to return the route with conflict
      mockRouteRepository.findById.mockResolvedValue(conflictRoute);
      
      const conflicts = await routeService.validateTimeWindows('route1', mockOrders);
      
      expect(conflicts).not.toBeNull(); // First check that conflicts is not null
      if (conflicts) { // TypeScript null check
        expect(conflicts.length).toBe(1);
        expect(conflicts[0]).toContain('time window');
        expect(conflicts[0]).toContain('order2');
      } else {
        fail('Expected conflicts to be an array but got null');
      }
    });
    
    it('should detect multiple conflicts in a route', async () => {
      // Create a route with multiple time window conflicts
      const multiConflictRoute: Route = {
        ...mockRoute,
        stops: [
          mockRoute.stops[0],
          {
            ...mockRoute.stops[1],
            estimatedArrival: new Date('2023-01-01T16:00:00Z') // After the time window ends at 15:00
          },
          {
            ...mockRoute.stops[2],
            estimatedArrival: new Date('2023-01-01T13:30:00Z') // Before the time window starts at 14:00
          }
        ]
      };
      
      // Mock repository to return the route with conflicts
      mockRouteRepository.findById.mockResolvedValue(multiConflictRoute);
      
      const conflicts = await routeService.validateTimeWindows('route1', mockOrders);
      
      expect(conflicts).not.toBeNull(); // First check that conflicts is not null
      if (conflicts) { // TypeScript null check
        expect(conflicts.length).toBe(2);
        expect(conflicts[0]).toContain('order2');
        expect(conflicts[1]).toContain('order3');
      } else {
        fail('Expected conflicts to be an array but got null');
      }
    });
    
    it('should return null if route not found', async () => {
      // Mock repository to return null
      mockRouteRepository.findById.mockResolvedValue(null);
      
      const conflicts = await routeService.validateTimeWindows('non-existent-id', mockOrders);
      
      expect(conflicts).toBeNull();
    });
  });
  
  describe('recalculateArrivalTimes', () => {
    it('should update estimated arrival times based on travel times', async () => {
      // Mock repository to return the route
      mockRouteRepository.findById.mockResolvedValue(mockRoute);
      
      // Mock MapsService to return updated stops with new arrival times
      const updatedStops = [
        {
          ...mockRoute.stops[0],
          estimatedArrival: new Date('2023-01-01T12:15:00Z')
        },
        {
          ...mockRoute.stops[1],
          estimatedArrival: new Date('2023-01-01T13:45:00Z')
        },
        {
          ...mockRoute.stops[2],
          estimatedArrival: new Date('2023-01-01T15:15:00Z')
        }
      ];
      
      (MapsService.calculateEstimatedTravelTimes as jest.Mock).mockResolvedValue(updatedStops);
      
      // Mock repository update
      const updatedRoute = {
        ...mockRoute,
        stops: updatedStops
      };
      mockRouteRepository.updateStops.mockResolvedValue(updatedRoute);
      
      // Call the method
      const result = await routeService.recalculateArrivalTimes('route1');
      
      // Verify the result
      expect(result).toEqual(updatedRoute);
      
      // Verify MapsService and repository were called
      expect(MapsService.calculateEstimatedTravelTimes).toHaveBeenCalledWith(
        mockRoute.stops,
        expect.any(Date)
      );
      expect(mockRouteRepository.updateStops).toHaveBeenCalledWith('route1', updatedStops);
    });
    
    it('should handle custom start time', async () => {
      // Mock repository to return the route
      mockRouteRepository.findById.mockResolvedValue(mockRoute);
      
      // Custom start time
      const customStartTime = new Date('2023-01-01T11:00:00Z');
      
      // Mock MapsService to return updated stops with new arrival times
      const updatedStops = [
        {
          ...mockRoute.stops[0],
          estimatedArrival: new Date('2023-01-01T11:15:00Z')
        },
        {
          ...mockRoute.stops[1],
          estimatedArrival: new Date('2023-01-01T12:45:00Z')
        },
        {
          ...mockRoute.stops[2],
          estimatedArrival: new Date('2023-01-01T14:15:00Z')
        }
      ];
      
      (MapsService.calculateEstimatedTravelTimes as jest.Mock).mockResolvedValue(updatedStops);
      
      // Mock repository update
      const updatedRoute = {
        ...mockRoute,
        stops: updatedStops
      };
      mockRouteRepository.updateStops.mockResolvedValue(updatedRoute);
      
      // Call the method with custom start time
      const result = await routeService.recalculateArrivalTimes('route1', customStartTime);
      
      // Verify the result
      expect(result).toEqual(updatedRoute);
      
      // Verify MapsService was called with the custom start time
      expect(MapsService.calculateEstimatedTravelTimes).toHaveBeenCalledWith(
        mockRoute.stops,
        customStartTime
      );
    });
    
    it('should return null if route not found', async () => {
      // Mock repository to return null
      mockRouteRepository.findById.mockResolvedValue(null);
      
      const result = await routeService.recalculateArrivalTimes('non-existent-id');
      
      expect(result).toBeNull();
      expect(MapsService.calculateEstimatedTravelTimes).not.toHaveBeenCalled();
    });
  });
  
  describe('optimizeRouteSequence', () => {
    it('should reorder stops to minimize time window conflicts', async () => {
      // Mock repository to return the route
      mockRouteRepository.findById.mockResolvedValue(mockRoute);
      
      // Mock optimized stops with reordered sequence
      const optimizedStops = [
        {
          ...mockRoute.stops[2], // Order 3 first
          sequence: 0,
          estimatedArrival: new Date('2023-01-01T14:30:00Z')
        },
        {
          ...mockRoute.stops[1], // Order 2 second
          sequence: 1,
          estimatedArrival: new Date('2023-01-01T15:30:00Z')
        },
        {
          ...mockRoute.stops[0], // Order 1 last
          sequence: 2,
          estimatedArrival: new Date('2023-01-01T16:30:00Z')
        }
      ];
      
      // Mock the optimization service or method
      jest.spyOn(routeService as any, 'findOptimalSequence').mockResolvedValue(optimizedStops);
      
      // Mock MapsService to calculate metrics for the optimized route
      (MapsService.calculateRouteMetrics as jest.Mock).mockResolvedValue({
        totalDistance: 12, // Shorter distance
        estimatedDuration: 40 // Shorter duration
      });
      
      // Mock repository updates
      const optimizedRoute = {
        ...mockRoute,
        stops: optimizedStops,
        totalDistance: 12,
        estimatedDuration: 40
      };
      mockRouteRepository.updateStops.mockResolvedValue(optimizedRoute);
      mockRouteRepository.updateRouteMetrics.mockResolvedValue(optimizedRoute);
      
      // Call the method
      const result = await routeService.optimizeRouteSequence('route1', mockOrders);
      
      // Verify the result
      expect(result).toEqual(optimizedRoute);
      
      // Verify repository updates were called
      expect(mockRouteRepository.updateStops).toHaveBeenCalledWith('route1', optimizedStops);
      expect(mockRouteRepository.updateRouteMetrics).toHaveBeenCalledWith(
        'route1',
        12,
        40
      );
    });
    
    it('should return null if route not found', async () => {
      // Mock repository to return null
      mockRouteRepository.findById.mockResolvedValue(null);
      
      const result = await routeService.optimizeRouteSequence('non-existent-id', mockOrders);
      
      expect(result).toBeNull();
    });
    
    it('should handle routes with no time windows', async () => {
      // Create a route with stops that have no time windows
      const noTimeWindowRoute: Route = {
        ...mockRoute,
        stops: [
          {
            orderId: 'order1', // Order 1 has no time window
            address: mockOrders[0].deliveryAddress,
            sequence: 0,
            estimatedArrival: new Date('2023-01-01T12:00:00Z')
          }
        ]
      };
      
      // Mock repository to return the route
      mockRouteRepository.findById.mockResolvedValue(noTimeWindowRoute);
      
      // Mock the optimization service to return the same stops (no change needed)
      jest.spyOn(routeService as any, 'findOptimalSequence').mockResolvedValue(noTimeWindowRoute.stops);
      
      // Mock MapsService to return the same metrics
      (MapsService.calculateRouteMetrics as jest.Mock).mockResolvedValue({
        totalDistance: 15,
        estimatedDuration: 45
      });
      
      // Mock repository updates
      mockRouteRepository.updateStops.mockResolvedValue(noTimeWindowRoute);
      mockRouteRepository.updateRouteMetrics.mockResolvedValue(noTimeWindowRoute);
      
      // Call the method
      const result = await routeService.optimizeRouteSequence('route1', mockOrders);
      
      // Verify the result
      expect(result).toEqual(noTimeWindowRoute);
      
      // Verify repository updates were called with the same values
      expect(mockRouteRepository.updateStops).toHaveBeenCalledWith('route1', noTimeWindowRoute.stops);
    });
  });
});
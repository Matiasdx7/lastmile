import MapsService from '../../services/MapsService';
import { Client } from '@googlemaps/google-maps-services-js';
import { RouteStop } from '../../../../shared/types/entities/Route';
import { Address } from '../../../../shared/types/common/Address';
import { Location } from '../../../../shared/types/common/Location';

// Mock the Google Maps client
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
});

describe('MapsService Integration Tests', () => {
  let mapsService: any;
  let mockClient: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Get the mocked client instance
    mockClient = new Client();
    
    // Create a new instance of MapsService for each test
    mapsService = MapsService;
    
    // Set the client property to our mock
    (mapsService as any).client = mockClient;
    
    // Set a mock API key
    (mapsService as any).apiKey = 'mock-api-key';
  });

  describe('Error handling and edge cases', () => {
    it('should handle API errors gracefully when geocoding', async () => {
      // Mock geocode to throw an error
      mockClient.geocode.mockRejectedValue(new Error('API Error'));
      
      // Mock address
      const address: Address = {
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        coordinates: { latitude: 0, longitude: 0 }
      };
      
      // Call the method and expect it to throw with a specific message
      await expect(mapsService.geocodeAddress(address)).rejects.toThrow(
        'Failed to geocode address'
      );
    });

    it('should handle API errors gracefully when getting directions', async () => {
      // Mock directions to throw an error
      mockClient.directions.mockRejectedValue(new Error('API Error'));
      
      // Mock locations
      const origin: Location = { latitude: 37.7749, longitude: -122.4194 };
      const destination: Location = { latitude: 37.3352, longitude: -121.8811 };
      
      // Call the method and expect it to throw with a specific message
      await expect(mapsService.getDirections(origin, destination)).rejects.toThrow(
        'Failed to get directions'
      );
    });

    it('should handle API errors gracefully when getting distance matrix', async () => {
      // Mock distancematrix to throw an error
      mockClient.distancematrix.mockRejectedValue(new Error('API Error'));
      
      // Mock locations
      const origins: Location[] = [
        { latitude: 37.7749, longitude: -122.4194 },
        { latitude: 37.3352, longitude: -121.8811 }
      ];
      const destinations: Location[] = [
        { latitude: 37.4419, longitude: -122.1430 },
        { latitude: 37.7749, longitude: -122.4194 }
      ];
      
      // Call the method and expect it to throw with a specific message
      await expect(mapsService.getDistanceMatrix(origins, destinations)).rejects.toThrow(
        'Failed to get distance matrix'
      );
    });
  });

  describe('Complex route scenarios', () => {
    it('should handle routes with multiple waypoints', async () => {
      // Mock locations for a complex route with multiple stops
      const origin: Location = { latitude: 37.7749, longitude: -122.4194 };
      const waypoint1: Location = { latitude: 37.8, longitude: -122.4 };
      const waypoint2: Location = { latitude: 37.85, longitude: -122.45 };
      const destination: Location = { latitude: 37.9, longitude: -122.5 };
      
      // Mock directions response with multiple legs
      mockClient.directions.mockResolvedValue({
        data: {
          routes: [
            {
              overview_polyline: {
                points: 'complex_polyline'
              },
              legs: [
                {
                  distance: { value: 5000 },
                  duration: { value: 600 },
                  steps: [
                    {
                      distance: { value: 5000 },
                      duration: { value: 600 },
                      html_instructions: 'Drive north',
                      polyline: { points: 'step1_polyline' },
                      start_location: { lat: origin.latitude, lng: origin.longitude },
                      end_location: { lat: waypoint1.latitude, lng: waypoint1.longitude }
                    }
                  ]
                },
                {
                  distance: { value: 6000 },
                  duration: { value: 720 },
                  steps: [
                    {
                      distance: { value: 6000 },
                      duration: { value: 720 },
                      html_instructions: 'Continue north',
                      polyline: { points: 'step2_polyline' },
                      start_location: { lat: waypoint1.latitude, lng: waypoint1.longitude },
                      end_location: { lat: waypoint2.latitude, lng: waypoint2.longitude }
                    }
                  ]
                },
                {
                  distance: { value: 7000 },
                  duration: { value: 840 },
                  steps: [
                    {
                      distance: { value: 7000 },
                      duration: { value: 840 },
                      html_instructions: 'Continue northwest',
                      polyline: { points: 'step3_polyline' },
                      start_location: { lat: waypoint2.latitude, lng: waypoint2.longitude },
                      end_location: { lat: destination.latitude, lng: destination.longitude }
                    }
                  ]
                }
              ]
            }
          ]
        }
      });
      
      // Call the method with waypoints
      const result = await mapsService.getDirections(
        origin, 
        destination,
        [waypoint1, waypoint2]
      );
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.distance).toBe(18000); // 5000 + 6000 + 7000
      expect(result.duration).toBe(2160); // 600 + 720 + 840
      expect(result.steps.length).toBe(3);
      
      // Verify the client was called correctly
      expect(mockClient.directions).toHaveBeenCalledWith({
        params: {
          origin: `${origin.latitude},${origin.longitude}`,
          destination: `${destination.latitude},${destination.longitude}`,
          waypoints: [`${waypoint1.latitude},${waypoint1.longitude}`, `${waypoint2.latitude},${waypoint2.longitude}`],
          mode: 'driving',
          units: 'metric',
          key: 'mock-api-key'
        }
      });
    });

    it('should handle large distance matrices efficiently', async () => {
      // Create a large set of locations (10 locations)
      const locations: Location[] = Array(10).fill(0).map((_, i) => ({
        latitude: 37.7 + i * 0.01,
        longitude: -122.4 + i * 0.01
      }));
      
      // Create a mock 10x10 distance matrix response
      const mockElements = Array(10).fill(0).map((_, i) => ({
        status: 'OK',
        distance: { value: 1000 * (i + 1) },
        duration: { value: 60 * (i + 1) }
      }));
      
      const mockRows = Array(10).fill(0).map(() => ({
        elements: mockElements
      }));
      
      mockClient.distancematrix.mockResolvedValue({
        data: {
          rows: mockRows
        }
      });
      
      // Call the method
      const result = await mapsService.getDistanceMatrix(locations, locations);
      
      // Verify the result dimensions
      expect(result.origins.length).toBe(10);
      expect(result.destinations.length).toBe(10);
      expect(result.distances.length).toBe(10);
      expect(result.distances[0].length).toBe(10);
      expect(result.durations.length).toBe(10);
      expect(result.durations[0].length).toBe(10);
      
      // Verify the client was called with all locations
      expect(mockClient.distancematrix).toHaveBeenCalledWith({
        params: {
          origins: locations.map(loc => `${loc.latitude},${loc.longitude}`),
          destinations: locations.map(loc => `${loc.latitude},${loc.longitude}`),
          mode: 'driving',
          units: 'metric',
          key: 'mock-api-key'
        }
      });
    });
  });

  describe('Time window handling', () => {
    it('should calculate accurate arrival times considering traffic', async () => {
      // Mock route stops
      const stops: RouteStop[] = [
        {
          orderId: 'order1',
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
          orderId: 'order2',
          address: {
            street: '456 Market St',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94105',
            coordinates: { latitude: 37.7900, longitude: -122.4000 }
          },
          sequence: 2,
          estimatedArrival: new Date()
        },
        {
          orderId: 'order3',
          address: {
            street: '789 Mission St',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94105',
            coordinates: { latitude: 37.7850, longitude: -122.4050 }
          },
          sequence: 3,
          estimatedArrival: new Date()
        }
      ];
      
      // Mock the getDistanceMatrix method with traffic-aware durations
      // Higher durations to simulate traffic
      mockClient.distancematrix.mockResolvedValue({
        data: {
          rows: [
            {
              elements: [
                { status: 'OK', distance: { value: 0 }, duration: { value: 0 } },
                { status: 'OK', distance: { value: 2000 }, duration: { value: 900 } }, // 15 min with traffic
                { status: 'OK', distance: { value: 1500 }, duration: { value: 720 } }  // 12 min with traffic
              ]
            },
            {
              elements: [
                { status: 'OK', distance: { value: 2000 }, duration: { value: 900 } },
                { status: 'OK', distance: { value: 0 }, duration: { value: 0 } },
                { status: 'OK', distance: { value: 800 }, duration: { value: 480 } }   // 8 min with traffic
              ]
            },
            {
              elements: [
                { status: 'OK', distance: { value: 1500 }, duration: { value: 720 } },
                { status: 'OK', distance: { value: 800 }, duration: { value: 480 } },
                { status: 'OK', distance: { value: 0 }, duration: { value: 0 } }
              ]
            }
          ]
        }
      });
      
      // Set a fixed start time for predictable testing
      const startTime = new Date('2023-01-01T12:00:00Z');
      
      // Call the method
      const result = await mapsService.calculateEstimatedTravelTimes(stops, startTime);
      
      // Verify the result
      expect(result.length).toBe(3);
      
      // First stop should be at the start time
      expect(result[0].estimatedArrival).toEqual(startTime);
      
      // Second stop should be 15 minutes (travel time) + 5 minutes (service time at first stop) later
      const expectedSecondStopTime = new Date('2023-01-01T12:20:00Z'); // 12:00 + 15min + 5min
      expect(result[1].estimatedArrival).toEqual(expectedSecondStopTime);
      
      // Third stop should be 8 minutes (travel time) + 5 minutes (service time at second stop) later
      const expectedThirdStopTime = new Date('2023-01-01T12:33:00Z'); // 12:20 + 8min + 5min
      expect(result[2].estimatedArrival).toEqual(expectedThirdStopTime);
    });
  });
});
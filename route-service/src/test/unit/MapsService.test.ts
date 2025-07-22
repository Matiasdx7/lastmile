import { Client } from '@googlemaps/google-maps-services-js';
import MapsService from '../../services/MapsService';
import { Address } from '../../../../shared/types/common/Address';
import { Location } from '../../../../shared/types/common/Location';
import { RouteStop } from '../../../../shared/types/entities/Route';

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

describe('MapsService', () => {
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

  describe('geocodeAddress', () => {
    it('should convert an address to coordinates', async () => {
      // Mock address
      const address: Address = {
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        coordinates: { latitude: 0, longitude: 0 } // Will be overwritten by geocode
      };
      
      // Mock geocode response
      mockClient.geocode.mockResolvedValue({
        data: {
          results: [
            {
              geometry: {
                location: {
                  lat: 37.7749,
                  lng: -122.4194
                }
              }
            }
          ]
        }
      });
      
      // Call the method
      const result = await mapsService.geocodeAddress(address);
      
      // Verify the result
      expect(result).toEqual({
        latitude: 37.7749,
        longitude: -122.4194
      });
      
      // Verify the client was called correctly
      expect(mockClient.geocode).toHaveBeenCalledWith({
        params: {
          address: '123 Main St, San Francisco, CA 94105',
          key: 'mock-api-key'
        }
      });
    });

    it('should throw an error when no results are found', async () => {
      // Mock address
      const address: Address = {
        street: 'Invalid Address',
        city: 'Nowhere',
        state: 'XX',
        zipCode: '00000',
        coordinates: { latitude: 0, longitude: 0 }
      };
      
      // Mock geocode response with no results
      mockClient.geocode.mockResolvedValue({
        data: {
          results: []
        }
      });
      
      // Call the method and expect it to throw
      await expect(mapsService.geocodeAddress(address)).rejects.toThrow(
        'No geocoding results found for address'
      );
    });
  });

  describe('getDirections', () => {
    it('should get directions between two locations', async () => {
      // Mock locations
      const origin: Location = { latitude: 37.7749, longitude: -122.4194 };
      const destination: Location = { latitude: 37.3352, longitude: -121.8811 };
      
      // Mock directions response
      mockClient.directions.mockResolvedValue({
        data: {
          routes: [
            {
              overview_polyline: {
                points: 'mock_polyline'
              },
              legs: [
                {
                  distance: { value: 80000 },
                  duration: { value: 3600 },
                  steps: [
                    {
                      distance: { value: 40000 },
                      duration: { value: 1800 },
                      html_instructions: 'Drive south',
                      polyline: { points: 'step1_polyline' },
                      start_location: { lat: 37.7749, lng: -122.4194 },
                      end_location: { lat: 37.5, lng: -122.0 }
                    },
                    {
                      distance: { value: 40000 },
                      duration: { value: 1800 },
                      html_instructions: 'Continue south',
                      polyline: { points: 'step2_polyline' },
                      start_location: { lat: 37.5, lng: -122.0 },
                      end_location: { lat: 37.3352, lng: -121.8811 }
                    }
                  ]
                }
              ]
            }
          ]
        }
      });
      
      // Call the method
      const result = await mapsService.getDirections(origin, destination);
      
      // Verify the result
      expect(result).toEqual({
        distance: 80000,
        duration: 3600,
        polyline: 'mock_polyline',
        steps: [
          {
            distance: 40000,
            duration: 1800,
            instructions: 'Drive south',
            polyline: 'step1_polyline',
            startLocation: { latitude: 37.7749, longitude: -122.4194 },
            endLocation: { latitude: 37.5, longitude: -122.0 }
          },
          {
            distance: 40000,
            duration: 1800,
            instructions: 'Continue south',
            polyline: 'step2_polyline',
            startLocation: { latitude: 37.5, longitude: -122.0 },
            endLocation: { latitude: 37.3352, longitude: -121.8811 }
          }
        ]
      });
      
      // Verify the client was called correctly
      expect(mockClient.directions).toHaveBeenCalledWith({
        params: {
          origin: '37.7749,-122.4194',
          destination: '37.3352,-121.8811',
          waypoints: [],
          mode: 'driving',
          units: 'metric',
          key: 'mock-api-key'
        }
      });
    });

    it('should throw an error when no routes are found', async () => {
      // Mock locations
      const origin: Location = { latitude: 37.7749, longitude: -122.4194 };
      const destination: Location = { latitude: 37.3352, longitude: -121.8811 };
      
      // Mock directions response with no routes
      mockClient.directions.mockResolvedValue({
        data: {
          routes: []
        }
      });
      
      // Call the method and expect it to throw
      await expect(mapsService.getDirections(origin, destination)).rejects.toThrow(
        'No routes found'
      );
    });
  });

  describe('getDistanceMatrix', () => {
    it('should calculate distances between multiple origins and destinations', async () => {
      // Mock locations
      const origins: Location[] = [
        { latitude: 37.7749, longitude: -122.4194 },
        { latitude: 37.3352, longitude: -121.8811 }
      ];
      const destinations: Location[] = [
        { latitude: 37.4419, longitude: -122.1430 },
        { latitude: 37.7749, longitude: -122.4194 }
      ];
      
      // Mock distance matrix response
      mockClient.distancematrix.mockResolvedValue({
        data: {
          rows: [
            {
              elements: [
                {
                  status: 'OK',
                  distance: { value: 50000 },
                  duration: { value: 2400 }
                },
                {
                  status: 'OK',
                  distance: { value: 0 },
                  duration: { value: 0 }
                }
              ]
            },
            {
              elements: [
                {
                  status: 'OK',
                  distance: { value: 30000 },
                  duration: { value: 1800 }
                },
                {
                  status: 'OK',
                  distance: { value: 80000 },
                  duration: { value: 3600 }
                }
              ]
            }
          ]
        }
      });
      
      // Call the method
      const result = await mapsService.getDistanceMatrix(origins, destinations);
      
      // Verify the result
      expect(result).toEqual({
        origins,
        destinations,
        distances: [
          [50000, 0],
          [30000, 80000]
        ],
        durations: [
          [2400, 0],
          [1800, 3600]
        ]
      });
      
      // Verify the client was called correctly
      expect(mockClient.distancematrix).toHaveBeenCalledWith({
        params: {
          origins: ['37.7749,-122.4194', '37.3352,-121.8811'],
          destinations: ['37.4419,-122.143', '37.7749,-122.4194'],
          mode: 'driving',
          units: 'metric',
          key: 'mock-api-key'
        }
      });
    });

    it('should handle error status in distance matrix elements', async () => {
      // Mock locations
      const origins: Location[] = [
        { latitude: 37.7749, longitude: -122.4194 }
      ];
      const destinations: Location[] = [
        { latitude: 37.4419, longitude: -122.1430 }
      ];
      
      // Mock distance matrix response with error status
      mockClient.distancematrix.mockResolvedValue({
        data: {
          rows: [
            {
              elements: [
                {
                  status: 'ZERO_RESULTS',
                }
              ]
            }
          ]
        }
      });
      
      // Call the method
      const result = await mapsService.getDistanceMatrix(origins, destinations);
      
      // Verify the result has -1 for error status
      expect(result).toEqual({
        origins,
        destinations,
        distances: [[-1]],
        durations: [[-1]]
      });
    });
  });

  describe('calculateEstimatedTravelTimes', () => {
    it('should calculate estimated arrival times for route stops', async () => {
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
        }
      ];
      
      // Mock the getDistanceMatrix method
      jest.spyOn(mapsService, 'getDistanceMatrix').mockResolvedValue({
        origins: [
          { latitude: 37.7749, longitude: -122.4194 },
          { latitude: 37.7900, longitude: -122.4000 }
        ],
        destinations: [
          { latitude: 37.7749, longitude: -122.4194 },
          { latitude: 37.7900, longitude: -122.4000 }
        ],
        distances: [
          [0, 2000],
          [2000, 0]
        ],
        durations: [
          [0, 600], // 10 minutes in seconds
          [600, 0]
        ]
      });
      
      // Set a fixed start time for predictable testing
      const startTime = new Date('2023-01-01T12:00:00Z');
      
      // Call the method
      const result = await mapsService.calculateEstimatedTravelTimes(stops, startTime);
      
      // Verify the result
      expect(result.length).toBe(2);
      expect(result[0].sequence).toBe(1);
      expect(result[0].estimatedArrival).toEqual(startTime);
      
      // Second stop should be 10 minutes (travel time) + 5 minutes (service time at first stop) later
      const expectedSecondStopTime = new Date('2023-01-01T12:15:00Z');
      expect(result[1].sequence).toBe(2);
      expect(result[1].estimatedArrival).toEqual(expectedSecondStopTime);
      
      // Verify getDistanceMatrix was called
      expect(mapsService.getDistanceMatrix).toHaveBeenCalled();
    });

    it('should handle single stop routes', async () => {
      // Mock single route stop
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
        }
      ];
      
      // Set a fixed start time for predictable testing
      const startTime = new Date('2023-01-01T12:00:00Z');
      
      // Call the method
      const result = await mapsService.calculateEstimatedTravelTimes(stops, startTime);
      
      // Verify the result
      expect(result.length).toBe(1);
      expect(result[0].sequence).toBe(1);
      expect(result[0].estimatedArrival).toEqual(startTime);
      
      // Verify getDistanceMatrix was not called for single stop
      expect(mapsService.getDistanceMatrix).not.toHaveBeenCalled();
    });
  });

  describe('calculateRouteMetrics', () => {
    it('should calculate total distance and duration for a route', async () => {
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
      
      // Mock the getDistanceMatrix method
      jest.spyOn(mapsService, 'getDistanceMatrix').mockResolvedValue({
        origins: [
          { latitude: 37.7749, longitude: -122.4194 },
          { latitude: 37.7900, longitude: -122.4000 },
          { latitude: 37.7850, longitude: -122.4050 }
        ],
        destinations: [
          { latitude: 37.7749, longitude: -122.4194 },
          { latitude: 37.7900, longitude: -122.4000 },
          { latitude: 37.7850, longitude: -122.4050 }
        ],
        distances: [
          [0, 2000, 1500],
          [2000, 0, 800],
          [1500, 800, 0]
        ],
        durations: [
          [0, 600, 450], // in seconds
          [600, 0, 240],
          [450, 240, 0]
        ]
      });
      
      // Call the method
      const result = await mapsService.calculateRouteMetrics(stops);
      
      // Verify the result
      // Total distance should be 2000 + 800 = 2800 meters
      // Total duration should be 600 + 240 = 840 seconds (driving) + 15 minutes (3 stops * 5 minutes) = 1140 seconds
      expect(result).toEqual({
        totalDistance: 2800,
        estimatedDuration: 1140
      });
      
      // Verify getDistanceMatrix was called
      expect(mapsService.getDistanceMatrix).toHaveBeenCalled();
    });

    it('should handle single stop routes', async () => {
      // Mock single route stop
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
        }
      ];
      
      // Call the method
      const result = await mapsService.calculateRouteMetrics(stops);
      
      // Verify the result
      expect(result).toEqual({
        totalDistance: 0,
        estimatedDuration: 0
      });
      
      // Verify getDistanceMatrix was not called for single stop
      expect(mapsService.getDistanceMatrix).not.toHaveBeenCalled();
    });
  });

  describe('generateTurnByTurnDirections', () => {
    it('should generate turn-by-turn directions for a route', async () => {
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
        }
      ];
      
      // Mock the getDirections method
      jest.spyOn(mapsService, 'getDirections').mockResolvedValue({
        distance: 2000,
        duration: 600,
        polyline: 'mock_polyline',
        steps: [
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
      });
      
      // Call the method
      const result = await mapsService.generateTurnByTurnDirections(stops);
      
      // Verify the result
      expect(result.length).toBe(1); // One segment between two stops
      expect(result[0].length).toBe(2); // Two steps in the directions
      expect(result[0][0].instructions).toBe('Head north on Main St');
      expect(result[0][1].instructions).toBe('Turn right onto Market St');
      
      // Verify getDirections was called
      expect(mapsService.getDirections).toHaveBeenCalledWith(
        { latitude: 37.7749, longitude: -122.4194 },
        { latitude: 37.7900, longitude: -122.4000 }
      );
    });

    it('should handle single stop routes', async () => {
      // Mock single route stop
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
        }
      ];
      
      // Call the method
      const result = await mapsService.generateTurnByTurnDirections(stops);
      
      // Verify the result is an empty array for single stop
      expect(result).toEqual([]);
      
      // Verify getDirections was not called
      expect(mapsService.getDirections).not.toHaveBeenCalled();
    });
  });
});
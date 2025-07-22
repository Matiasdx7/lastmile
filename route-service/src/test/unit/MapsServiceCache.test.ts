import MapsService from '../../services/MapsService';
import RedisService from '../../services/RedisService';
import { Client } from '@googlemaps/google-maps-services-js';

// Mock RedisService
jest.mock('../../services/RedisService', () => ({
  getJson: jest.fn(),
  setJson: jest.fn(),
  del: jest.fn(),
  invalidatePattern: jest.fn()
}));

// Mock Google Maps Client
jest.mock('@googlemaps/google-maps-services-js', () => {
  const mockResponse = {
    data: {
      results: [
        {
          geometry: {
            location: {
              lat: 40.7128,
              lng: -74.006
            }
          }
        }
      ],
      routes: [
        {
          legs: [
            {
              distance: { value: 1000 },
              duration: { value: 300 },
              steps: [
                {
                  distance: { value: 500 },
                  duration: { value: 150 },
                  html_instructions: 'Turn right',
                  polyline: { points: 'abc123' },
                  start_location: { lat: 40.7128, lng: -74.006 },
                  end_location: { lat: 40.7129, lng: -74.007 }
                }
              ]
            }
          ],
          overview_polyline: { points: 'xyz789' }
        }
      ],
      rows: [
        {
          elements: [
            {
              status: 'OK',
              distance: { value: 1000 },
              duration: { value: 300 }
            }
          ]
        }
      ]
    }
  };

  return {
    Client: jest.fn().mockImplementation(() => ({
      geocode: jest.fn().mockResolvedValue(mockResponse),
      directions: jest.fn().mockResolvedValue(mockResponse),
      distancematrix: jest.fn().mockResolvedValue(mockResponse)
    }))
  };
});

describe('MapsService Cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('geocodeAddress', () => {
    const testAddress = {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      coordinates: { latitude: 0, longitude: 0 }
    };

    it('should return cached geocode result if available', async () => {
      const cachedLocation = { latitude: 40.7128, longitude: -74.006 };
      (RedisService.getJson as jest.Mock).mockResolvedValue(cachedLocation);

      const result = await MapsService.geocodeAddress(testAddress);

      expect(RedisService.getJson).toHaveBeenCalled();
      expect(result).toEqual(cachedLocation);
      expect(Client).not.toHaveBeenCalled();
    });

    it('should call Google Maps API and cache result if not in cache', async () => {
      (RedisService.getJson as jest.Mock).mockResolvedValue(null);

      const result = await MapsService.geocodeAddress(testAddress);

      expect(RedisService.getJson).toHaveBeenCalled();
      expect(RedisService.setJson).toHaveBeenCalled();
      expect(result).toEqual({ latitude: 40.7128, longitude: -74.006 });
    });
  });

  describe('getDirections', () => {
    const origin = { latitude: 40.7128, longitude: -74.006 };
    const destination = { latitude: 40.7129, longitude: -74.007 };

    it('should return cached directions if available', async () => {
      const cachedDirections = {
        distance: 1000,
        duration: 300,
        polyline: 'xyz789',
        steps: []
      };
      (RedisService.getJson as jest.Mock).mockResolvedValue(cachedDirections);

      const result = await MapsService.getDirections(origin, destination);

      expect(RedisService.getJson).toHaveBeenCalled();
      expect(result).toEqual(cachedDirections);
      expect(Client).not.toHaveBeenCalled();
    });

    it('should call Google Maps API and cache result if not in cache', async () => {
      (RedisService.getJson as jest.Mock).mockResolvedValue(null);

      const result = await MapsService.getDirections(origin, destination);

      expect(RedisService.getJson).toHaveBeenCalled();
      expect(RedisService.setJson).toHaveBeenCalled();
      expect(result).toHaveProperty('distance', 1000);
      expect(result).toHaveProperty('duration', 300);
      expect(result).toHaveProperty('polyline', 'xyz789');
    });
  });

  describe('getDistanceMatrix', () => {
    const origins = [{ latitude: 40.7128, longitude: -74.006 }];
    const destinations = [{ latitude: 40.7129, longitude: -74.007 }];

    it('should return cached distance matrix if available', async () => {
      const cachedMatrix = {
        origins,
        destinations,
        distances: [[1000]],
        durations: [[300]]
      };
      (RedisService.getJson as jest.Mock).mockResolvedValue(cachedMatrix);

      const result = await MapsService.getDistanceMatrix(origins, destinations);

      expect(RedisService.getJson).toHaveBeenCalled();
      expect(result).toEqual(cachedMatrix);
      expect(Client).not.toHaveBeenCalled();
    });

    it('should call Google Maps API and cache result if not in cache', async () => {
      (RedisService.getJson as jest.Mock).mockResolvedValue(null);

      const result = await MapsService.getDistanceMatrix(origins, destinations);

      expect(RedisService.getJson).toHaveBeenCalled();
      expect(RedisService.setJson).toHaveBeenCalled();
      expect(result).toHaveProperty('origins', origins);
      expect(result).toHaveProperty('destinations', destinations);
      expect(result.distances).toEqual([[1000]]);
      expect(result.durations).toEqual([[300]]);
    });
  });

  describe('invalidateRouteCaches', () => {
    it('should invalidate all route-related caches', async () => {
      await MapsService.invalidateRouteCaches();

      expect(RedisService.invalidatePattern).toHaveBeenCalledTimes(2);
    });
  });
});
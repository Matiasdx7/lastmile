import { Client, TravelMode, UnitSystem } from '@googlemaps/google-maps-services-js';
import { Address } from '../../../shared/types/common/Address';
import { Location } from '../../../shared/types/common/Location';
import { RouteStop } from '../../../shared/types/entities/Route';
import RedisService from './RedisService';
import dotenv from 'dotenv';

dotenv.config();

export interface DirectionsResult {
  distance: number; // in meters
  duration: number; // in seconds
  polyline: string; // encoded polyline
  steps: DirectionStep[];
}

export interface DirectionStep {
  distance: number;
  duration: number;
  instructions: string;
  polyline: string;
  startLocation: Location;
  endLocation: Location;
}

export interface DistanceMatrixResult {
  origins: Location[];
  destinations: Location[];
  distances: number[][]; // in meters
  durations: number[][]; // in seconds
}

export class MapsService {
  private client: Client;
  private apiKey: string;
  private readonly CACHE_TTL = 86400; // 24 hours in seconds
  private readonly GEOCODE_CACHE_PREFIX = 'geocode:';
  private readonly DIRECTIONS_CACHE_PREFIX = 'directions:';
  private readonly DISTANCE_MATRIX_CACHE_PREFIX = 'distance_matrix:';

  constructor() {
    this.client = new Client({});
    this.apiKey = process.env.MAPS_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Maps API key not found. Map functionality will be limited.');
    }
  }

  /**
   * Converts an address to geographic coordinates
   * @param address The address to geocode
   * @returns Promise with the location coordinates
   */
  async geocodeAddress(address: Address): Promise<Location> {
    try {
      const addressString = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
      
      // Create a cache key based on the address
      const cacheKey = `${this.GEOCODE_CACHE_PREFIX}${Buffer.from(addressString).toString('base64')}`;
      
      // Try to get from cache first
      const cachedLocation = await RedisService.getJson<Location>(cacheKey);
      
      if (cachedLocation) {
        console.log(`Cache hit for geocoding: ${addressString}`);
        return cachedLocation;
      }
      
      console.log(`Cache miss for geocoding: ${addressString}`);
      const response = await this.client.geocode({
        params: {
          address: addressString,
          key: this.apiKey
        }
      });

      if (response.data.results.length === 0) {
        throw new Error(`No geocoding results found for address: ${addressString}`);
      }

      const location = response.data.results[0].geometry.location;
      const result = {
        latitude: location.lat,
        longitude: location.lng
      };
      
      // Cache the result - geocoding results rarely change, so use a longer TTL
      await RedisService.setJson(cacheKey, result, this.CACHE_TTL);
      
      return result;
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw new Error(`Failed to geocode address: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets directions between two locations
   * @param origin Starting location
   * @param destination Ending location
   * @param waypoints Optional intermediate stops
   * @returns Promise with directions result
   */
  async getDirections(
    origin: Location,
    destination: Location,
    waypoints?: Location[]
  ): Promise<DirectionsResult> {
    try {
      // Create a cache key based on the origin, destination, and waypoints
      const originStr = `${origin.latitude.toFixed(6)},${origin.longitude.toFixed(6)}`;
      const destStr = `${destination.latitude.toFixed(6)},${destination.longitude.toFixed(6)}`;
      let waypointsStr = '';
      
      if (waypoints && waypoints.length > 0) {
        waypointsStr = waypoints
          .map(wp => `${wp.latitude.toFixed(6)},${wp.longitude.toFixed(6)}`)
          .join('|');
      }
      
      const cacheKey = `${this.DIRECTIONS_CACHE_PREFIX}${Buffer.from(`${originStr}|${destStr}|${waypointsStr}`).toString('base64')}`;
      
      // Try to get from cache first
      const cachedDirections = await RedisService.getJson<DirectionsResult>(cacheKey);
      
      if (cachedDirections) {
        console.log(`Cache hit for directions: ${originStr} to ${destStr}`);
        return cachedDirections;
      }
      
      console.log(`Cache miss for directions: ${originStr} to ${destStr}`);
      const waypointLocations = waypoints?.map(wp => `${wp.latitude},${wp.longitude}`) || [];
      
      const response = await this.client.directions({
        params: {
          origin: `${origin.latitude},${origin.longitude}`,
          destination: `${destination.latitude},${destination.longitude}`,
          waypoints: waypointLocations,
          mode: TravelMode.driving,
          units: UnitSystem.metric,
          key: this.apiKey
        }
      });

      if (response.data.routes.length === 0) {
        throw new Error('No routes found');
      }

      const route = response.data.routes[0];
      const legs = route.legs;
      
      let totalDistance = 0;
      let totalDuration = 0;
      const steps: DirectionStep[] = [];

      legs.forEach(leg => {
        totalDistance += leg.distance.value;
        totalDuration += leg.duration.value;

        leg.steps.forEach(step => {
          steps.push({
            distance: step.distance.value,
            duration: step.duration.value,
            instructions: step.html_instructions,
            polyline: step.polyline.points,
            startLocation: {
              latitude: step.start_location.lat,
              longitude: step.start_location.lng
            },
            endLocation: {
              latitude: step.end_location.lat,
              longitude: step.end_location.lng
            }
          });
        });
      });

      const result = {
        distance: totalDistance,
        duration: totalDuration,
        polyline: route.overview_polyline.points,
        steps
      };
      
      // Cache the result - use a shorter TTL for directions as traffic conditions may change
      const directionsCacheTTL = 3600; // 1 hour in seconds
      await RedisService.setJson(cacheKey, result, directionsCacheTTL);
      
      return result;
    } catch (error) {
      console.error('Error getting directions:', error);
      throw new Error(`Failed to get directions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Calculates a distance matrix between multiple origins and destinations
   * @param origins Array of origin locations
   * @param destinations Array of destination locations
   * @returns Promise with distance matrix result
   */
  async getDistanceMatrix(
    origins: Location[],
    destinations: Location[]
  ): Promise<DistanceMatrixResult> {
    try {
      // Create a cache key based on the origins and destinations
      // We need to be careful with the key size, so we'll use a hash of the coordinates
      const originsHash = origins
        .map(loc => `${loc.latitude.toFixed(6)},${loc.longitude.toFixed(6)}`)
        .join('|');
      
      const destinationsHash = destinations
        .map(loc => `${loc.latitude.toFixed(6)},${loc.longitude.toFixed(6)}`)
        .join('|');
      
      const cacheKey = `${this.DISTANCE_MATRIX_CACHE_PREFIX}${Buffer.from(`${originsHash}|${destinationsHash}`).toString('base64')}`;
      
      // Try to get from cache first
      const cachedMatrix = await RedisService.getJson<DistanceMatrixResult>(cacheKey);
      
      if (cachedMatrix) {
        console.log(`Cache hit for distance matrix with ${origins.length} origins and ${destinations.length} destinations`);
        return cachedMatrix;
      }
      
      console.log(`Cache miss for distance matrix with ${origins.length} origins and ${destinations.length} destinations`);
      const originStrings = origins.map(loc => `${loc.latitude},${loc.longitude}`);
      const destinationStrings = destinations.map(loc => `${loc.latitude},${loc.longitude}`);

      const response = await this.client.distancematrix({
        params: {
          origins: originStrings,
          destinations: destinationStrings,
          mode: TravelMode.driving,
          units: UnitSystem.metric,
          key: this.apiKey
        }
      });

      const rows = response.data.rows;
      const distances: number[][] = [];
      const durations: number[][] = [];

      rows.forEach(row => {
        const distanceRow: number[] = [];
        const durationRow: number[] = [];

        row.elements.forEach(element => {
          if (element.status === 'OK') {
            distanceRow.push(element.distance.value);
            durationRow.push(element.duration.value);
          } else {
            distanceRow.push(-1); // Indicate error or no route
            durationRow.push(-1);
          }
        });

        distances.push(distanceRow);
        durations.push(durationRow);
      });

      const result = {
        origins,
        destinations,
        distances,
        durations
      };
      
      // Cache the result - use a shorter TTL for distance matrix as traffic conditions may change
      const matrixCacheTTL = 3600; // 1 hour in seconds
      await RedisService.setJson(cacheKey, result, matrixCacheTTL);
      
      return result;
    } catch (error) {
      console.error('Error getting distance matrix:', error);
      throw new Error(`Failed to get distance matrix: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Calculates the estimated travel time between stops
   * @param stops Array of route stops
   * @returns Promise with updated stops including estimated arrival times
   */
  async calculateEstimatedTravelTimes(
    stops: RouteStop[],
    startTime: Date = new Date()
  ): Promise<RouteStop[]> {
    if (stops.length <= 1) {
      return stops;
    }

    // Sort stops by sequence
    const sortedStops = [...stops].sort((a, b) => a.sequence - b.sequence);
    
    // Extract locations for distance matrix calculation
    const locations = sortedStops.map(stop => stop.address.coordinates);
    
    // Get distance matrix for all stops
    const distanceMatrix = await this.getDistanceMatrix(locations, locations);
    
    // Calculate estimated arrival times
    let currentTime = new Date(startTime.getTime());
    const updatedStops: RouteStop[] = [];
    
    for (let i = 0; i < sortedStops.length; i++) {
      const stop = { ...sortedStops[i] };
      
      // First stop uses the start time
      if (i === 0) {
        stop.estimatedArrival = new Date(currentTime.getTime());
      } else {
        // Get travel time from previous stop to current stop
        const prevIndex = i - 1;
        const travelTimeSeconds = distanceMatrix.durations[prevIndex][i];
        
        if (travelTimeSeconds > 0) {
          // Add travel time to current time
          currentTime = new Date(currentTime.getTime() + travelTimeSeconds * 1000);
          stop.estimatedArrival = new Date(currentTime.getTime());
        } else {
          // If no valid route, use previous stop time + 10 minutes as fallback
          currentTime = new Date(currentTime.getTime() + 10 * 60 * 1000);
          stop.estimatedArrival = new Date(currentTime.getTime());
        }
      }
      
      // Add estimated service time at stop (assuming 5 minutes per stop)
      currentTime = new Date(currentTime.getTime() + 5 * 60 * 1000);
      
      updatedStops.push(stop);
    }
    
    return updatedStops;
  }

  /**
   * Calculates the total distance and duration for a route with multiple stops
   * @param stops Array of route stops
   * @returns Promise with total distance (meters) and duration (seconds)
   */
  async calculateRouteMetrics(stops: RouteStop[]): Promise<{ totalDistance: number; estimatedDuration: number }> {
    if (stops.length <= 1) {
      return { totalDistance: 0, estimatedDuration: 0 };
    }

    // Sort stops by sequence
    const sortedStops = [...stops].sort((a, b) => a.sequence - b.sequence);
    
    // Extract locations for distance matrix calculation
    const locations = sortedStops.map(stop => stop.address.coordinates);
    
    // Get distance matrix for all stops
    const distanceMatrix = await this.getDistanceMatrix(locations, locations);
    
    let totalDistance = 0;
    let totalDuration = 0;
    
    // Sum up distances and durations between consecutive stops
    for (let i = 0; i < sortedStops.length - 1; i++) {
      const nextIndex = i + 1;
      const distance = distanceMatrix.distances[i][nextIndex];
      const duration = distanceMatrix.durations[i][nextIndex];
      
      if (distance > 0 && duration > 0) {
        totalDistance += distance;
        totalDuration += duration;
      }
    }
    
    // Add estimated service time at each stop (assuming 5 minutes per stop)
    totalDuration += sortedStops.length * 5 * 60; // 5 minutes in seconds
    
    return { totalDistance, estimatedDuration: totalDuration };
  }

  /**
   * Generates turn-by-turn directions for a route with multiple stops
   * @param stops Array of route stops
   * @returns Promise with detailed directions for each segment
   */
  async generateTurnByTurnDirections(stops: RouteStop[]): Promise<DirectionStep[][]> {
    if (stops.length <= 1) {
      return [];
    }

    // Sort stops by sequence
    const sortedStops = [...stops].sort((a, b) => a.sequence - b.sequence);
    
    const directions: DirectionStep[][] = [];
    
    // Get directions between consecutive stops
    for (let i = 0; i < sortedStops.length - 1; i++) {
      const origin = sortedStops[i].address.coordinates;
      const destination = sortedStops[i + 1].address.coordinates;
      
      try {
        const result = await this.getDirections(origin, destination);
        directions.push(result.steps);
      } catch (error) {
        console.error(`Error getting directions between stops ${i} and ${i + 1}:`, error);
        directions.push([]);
      }
    }
    
    return directions;
  }
  /**
   * Invalidates all route-related caches
   * This should be called when road conditions change significantly
   * (e.g., traffic incidents, road closures, etc.)
   */
  async invalidateRouteCaches(): Promise<void> {
    try {
      // Invalidate directions cache
      await RedisService.invalidatePattern(`${this.DIRECTIONS_CACHE_PREFIX}*`);
      
      // Invalidate distance matrix cache
      await RedisService.invalidatePattern(`${this.DISTANCE_MATRIX_CACHE_PREFIX}*`);
      
      console.log('Route caches invalidated successfully');
    } catch (error) {
      console.error('Error invalidating route caches:', error);
    }
  }
}

export default new MapsService();
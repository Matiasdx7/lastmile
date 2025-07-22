import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { Route, RouteStop, RouteStatus } from '../../../shared/types';
import { RouteRepository } from '../../../shared/database/repositories/RouteRepository';
import MapsService, { DirectionStep } from './MapsService';
import RedisService from './RedisService';
import { Location } from '../../../shared/types/common/Location';
import { Address } from '../../../shared/types/common/Address';

export class RouteService {
  private routeRepository: RouteRepository;
  private readonly CACHE_TTL = 3600; // 1 hour in seconds
  private readonly ROUTE_CACHE_PREFIX = 'route:';
  private readonly ROUTE_MAP_CACHE_PREFIX = 'route_map:';
  private readonly TURN_BY_TURN_CACHE_PREFIX = 'turn_by_turn:';

  constructor(pool: Pool) {
    this.routeRepository = new RouteRepository(pool);
  }

  /**
   * Creates a new route with the given stops
   * @param loadId The ID of the load associated with this route
   * @param vehicleId The ID of the vehicle assigned to this route
   * @param stops The stops to include in the route
   * @returns The created route
   */
  async createRoute(loadId: string, vehicleId: string, stops: RouteStop[]): Promise<Route> {
    try {
      // Calculate route metrics using Maps API
      const { totalDistance, estimatedDuration } = await MapsService.calculateRouteMetrics(stops);
      
      // Calculate estimated arrival times for each stop
      const stopsWithTimes = await MapsService.calculateEstimatedTravelTimes(stops);
      
      const route: Omit<Route, 'id' | 'createdAt' | 'updatedAt'> = {
        loadId,
        vehicleId,
        stops: stopsWithTimes,
        totalDistance,
        estimatedDuration,
        status: RouteStatus.PLANNED
      };
      
      return await this.routeRepository.create(route);
    } catch (error) {
      console.error('Error creating route:', error);
      throw new Error(`Failed to create route: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets a route by its ID
   * @param id The route ID
   * @returns The route or null if not found
   */
  async getRouteById(id: string): Promise<Route | null> {
    // Try to get from cache first
    const cacheKey = `${this.ROUTE_CACHE_PREFIX}${id}`;
    const cachedRoute = await RedisService.getJson<Route>(cacheKey);
    
    if (cachedRoute) {
      console.log(`Cache hit for route: ${id}`);
      return cachedRoute;
    }
    
    console.log(`Cache miss for route: ${id}`);
    const route = await this.routeRepository.findById(id);
    
    // Cache the result if found
    if (route) {
      await RedisService.setJson(cacheKey, route, this.CACHE_TTL);
    }
    
    return route;
  }

  /**
   * Gets all routes
   * @returns Array of routes
   */
  async getAllRoutes(): Promise<Route[]> {
    return await this.routeRepository.findAll();
  }

  /**
   * Gets routes by status
   * @param status The route status to filter by
   * @returns Array of routes with the specified status
   */
  async getRoutesByStatus(status: RouteStatus): Promise<Route[]> {
    return await this.routeRepository.findByStatus(status);
  }

  /**
   * Gets a route by load ID
   * @param loadId The load ID
   * @returns The route associated with the load or null if not found
   */
  async getRouteByLoadId(loadId: string): Promise<Route | null> {
    return await this.routeRepository.findByLoadId(loadId);
  }

  /**
   * Gets routes by vehicle ID
   * @param vehicleId The vehicle ID
   * @returns Array of routes assigned to the vehicle
   */
  async getRoutesByVehicleId(vehicleId: string): Promise<Route[]> {
    return await this.routeRepository.findByVehicleId(vehicleId);
  }

  /**
   * Updates the stops in a route and recalculates metrics
   * @param id The route ID
   * @param stops The new stops
   * @returns The updated route or null if not found
   */
  async updateRouteStops(id: string, stops: RouteStop[]): Promise<Route | null> {
    try {
      const route = await this.routeRepository.findById(id);
      if (!route) {
        return null;
      }
      
      // Calculate new route metrics
      const { totalDistance, estimatedDuration } = await MapsService.calculateRouteMetrics(stops);
      
      // Calculate estimated arrival times for each stop
      const stopsWithTimes = await MapsService.calculateEstimatedTravelTimes(stops);
      
      // Update the route with new stops and metrics
      await this.routeRepository.updateStops(id, stopsWithTimes);
      const updatedRoute = await this.routeRepository.updateRouteMetrics(id, totalDistance, estimatedDuration);
      
      // Invalidate route caches
      await this.invalidateRouteCaches(id);
      
      return updatedRoute;
    } catch (error) {
      console.error('Error updating route stops:', error);
      throw new Error(`Failed to update route stops: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Updates the status of a route
   * @param id The route ID
   * @param status The new status
   * @returns The updated route or null if not found
   */
  async updateRouteStatus(id: string, status: RouteStatus): Promise<Route | null> {
    const updatedRoute = await this.routeRepository.updateStatus(id, status);
    
    // Invalidate route cache
    if (updatedRoute) {
      await this.invalidateRouteCaches(id);
    }
    
    return updatedRoute;
  }

  /**
   * Geocodes an address to get coordinates
   * @param address The address to geocode
   * @returns The location coordinates
   */
  async geocodeAddress(address: Address): Promise<Location> {
    return await MapsService.geocodeAddress(address);
  }

  /**
   * Calculates the distance and duration between two locations
   * @param origin The starting location
   * @param destination The ending location
   * @returns Object with distance (meters) and duration (seconds)
   */
  async calculateDistance(origin: Location, destination: Location): Promise<{ distance: number; duration: number }> {
    try {
      const directions = await MapsService.getDirections(origin, destination);
      return {
        distance: directions.distance,
        duration: directions.duration
      };
    } catch (error) {
      console.error('Error calculating distance:', error);
      throw new Error(`Failed to calculate distance: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generates turn-by-turn directions for a route
   * @param routeId The route ID
   * @returns Array of direction steps for each segment of the route
   */
  async generateTurnByTurnDirections(routeId: string): Promise<DirectionStep[][]> {
    try {
      // Try to get from cache first
      const cacheKey = `${this.TURN_BY_TURN_CACHE_PREFIX}${routeId}`;
      const cachedDirections = await RedisService.getJson<DirectionStep[][]>(cacheKey);
      
      if (cachedDirections) {
        console.log(`Cache hit for turn-by-turn directions: ${routeId}`);
        return cachedDirections;
      }
      
      console.log(`Cache miss for turn-by-turn directions: ${routeId}`);
      const route = await this.routeRepository.findById(routeId);
      if (!route) {
        throw new Error(`Route not found with ID: ${routeId}`);
      }
      
      const directions = await MapsService.generateTurnByTurnDirections(route.stops);
      
      // Cache the result
      await RedisService.setJson(cacheKey, directions, this.CACHE_TTL);
      
      return directions;
    } catch (error) {
      console.error('Error generating turn-by-turn directions:', error);
      throw new Error(`Failed to generate directions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Calculates estimated travel times for a route
   * @param routeId The route ID
   * @param startTime Optional start time (defaults to now)
   * @returns Updated route with estimated arrival times
   */
  async calculateEstimatedTravelTimes(routeId: string, startTime?: Date): Promise<Route | null> {
    try {
      const route = await this.routeRepository.findById(routeId);
      if (!route) {
        return null;
      }
      
      const stopsWithTimes = await MapsService.calculateEstimatedTravelTimes(
        route.stops,
        startTime || new Date()
      );
      
      return await this.routeRepository.updateStops(routeId, stopsWithTimes);
    } catch (error) {
      console.error('Error calculating estimated travel times:', error);
      throw new Error(`Failed to calculate travel times: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Alias for calculateEstimatedTravelTimes for backward compatibility
   */
  async recalculateArrivalTimes(routeId: string, startTime?: Date): Promise<Route | null> {
    return this.calculateEstimatedTravelTimes(routeId, startTime);
  }
  
  /**
   * Generates map data for route visualization
   * @param routeId The route ID
   * @returns Map data with polyline and waypoints
   */
  async generateRouteMapData(routeId: string): Promise<{
    polyline: string;
    waypoints: Array<{
      location: Location;
      orderId: string;
      sequence: number;
      estimatedArrival: Date;
    }>;
  }> {
    try {
      // Try to get from cache first
      const cacheKey = `${this.ROUTE_MAP_CACHE_PREFIX}${routeId}`;
      const cachedMapData = await RedisService.getJson<{
        polyline: string;
        waypoints: Array<{
          location: Location;
          orderId: string;
          sequence: number;
          estimatedArrival: Date;
        }>;
      }>(cacheKey);
      
      if (cachedMapData) {
        console.log(`Cache hit for route map data: ${routeId}`);
        return {
          ...cachedMapData,
          waypoints: cachedMapData.waypoints.map(wp => ({
            ...wp,
            estimatedArrival: new Date(wp.estimatedArrival) // Convert string back to Date
          }))
        };
      }
      
      console.log(`Cache miss for route map data: ${routeId}`);
      const route = await this.routeRepository.findById(routeId);
      if (!route) {
        throw new Error(`Route not found with ID: ${routeId}`);
      }
      
      // Sort stops by sequence
      const sortedStops = [...route.stops].sort((a, b) => a.sequence - b.sequence);
      
      // Extract locations for directions
      const locations = sortedStops.map(stop => stop.address.coordinates);
      
      if (locations.length <= 1) {
        const result = {
          polyline: '',
          waypoints: sortedStops.map(stop => ({
            location: stop.address.coordinates,
            orderId: stop.orderId,
            sequence: stop.sequence,
            estimatedArrival: stop.estimatedArrival
          }))
        };
        
        // Cache the result
        await RedisService.setJson(cacheKey, result, this.CACHE_TTL);
        
        return result;
      }
      
      // Generate a complete route through all waypoints
      let polyline = '';
      
      // If there are multiple stops, get directions for the complete route
      if (locations.length >= 2) {
        // Get directions from first to last stop with intermediate stops as waypoints
        const origin = locations[0];
        const destination = locations[locations.length - 1];
        const waypoints = locations.slice(1, -1);
        
        try {
          const directions = await MapsService.getDirections(origin, destination, waypoints);
          polyline = directions.polyline;
        } catch (error) {
          console.error('Error getting directions for route map:', error);
          // If directions fail, return empty polyline but still return waypoints
        }
      }
      
      const result = {
        polyline,
        waypoints: sortedStops.map(stop => ({
          location: stop.address.coordinates,
          orderId: stop.orderId,
          sequence: stop.sequence,
          estimatedArrival: stop.estimatedArrival
        }))
      };
      
      // Cache the result
      await RedisService.setJson(cacheKey, result, this.CACHE_TTL);
      
      return result;
    } catch (error) {
      console.error('Error generating route map data:', error);
      throw new Error(`Failed to generate route map data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Reorders stops in a route based on drag-and-drop sequence
   * @param routeId The route ID
   * @param stopOrder Array of orderIds in the new sequence
   * @returns Updated route with reordered stops and recalculated metrics
   */
  async reorderRouteStops(routeId: string, stopOrder: string[]): Promise<Route | null> {
    try {
      const route = await this.routeRepository.findById(routeId);
      if (!route) {
        return null;
      }
      
      // Validate that all orderIds in stopOrder exist in the route
      const orderIds = new Set(route.stops.map(stop => stop.orderId));
      const allOrderIdsExist = stopOrder.every(orderId => orderIds.has(orderId));
      
      if (!allOrderIdsExist) {
        throw new Error('Invalid stop order: contains orderIds that do not exist in the route');
      }
      
      // Create a map of orderId to stop for easy lookup
      const stopMap = new Map(route.stops.map(stop => [stop.orderId, stop]));
      
      // Create new stops array with updated sequence
      const updatedStops = stopOrder.map((orderId, index) => {
        const stop = stopMap.get(orderId);
        if (!stop) {
          throw new Error(`Stop with orderId ${orderId} not found in route`);
        }
        return {
          ...stop,
          sequence: index
        };
      });
      
      // Update any remaining stops that weren't in the stopOrder array
      // (this shouldn't happen if the client sends all stops, but just in case)
      route.stops.forEach(stop => {
        if (!stopOrder.includes(stop.orderId)) {
          updatedStops.push({
            ...stop,
            sequence: updatedStops.length
          });
        }
      });
      
      // Update the route with the new stop order and recalculate metrics
      return await this.updateRouteStops(routeId, updatedStops);
    } catch (error) {
      console.error('Error reordering route stops:', error);
      throw new Error(`Failed to reorder route stops: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validates a route for time window conflicts
   * @param routeId The route ID
   * @param orders Array of orders with time windows
   * @returns Array of conflict descriptions or null if route not found
   */
  async validateTimeWindows(routeId: string, orders: any[]): Promise<string[] | null> {
    try {
      const route = await this.routeRepository.findById(routeId);
      if (!route) {
        return null;
      }
      
      return this.detectTimeWindowConflicts(route, orders);
    } catch (error) {
      console.error('Error validating time windows:', error);
      throw new Error(`Failed to validate time windows: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Detects time window conflicts for a route
   * @param routeOrId Route object or route ID
   * @param orders Array of orders with time windows
   * @returns Array of conflict descriptions or null if route not found
   */
  async detectTimeWindowConflicts(routeOrId: string | Route, orders: any[]): Promise<string[] | null> {
    try {
      let route: Route | null;
      
      if (typeof routeOrId === 'string') {
        route = await this.routeRepository.findById(routeOrId);
        if (!route) {
          return null;
        }
      } else {
        route = routeOrId;
      }
      
      const conflicts: string[] = [];
      
      // Check each stop against its time window
      for (const stop of route.stops) {
        const order = orders.find(o => o.id === stop.orderId);
        
        if (order && order.timeWindow) {
          const arrivalTime = stop.estimatedArrival;
          const { startTime, endTime } = order.timeWindow;
          
          // Check if arrival time is outside the time window
          if (arrivalTime < startTime) {
            conflicts.push(`Stop for order ${order.id}: Estimated arrival at ${arrivalTime.toLocaleTimeString()} is before the time window starts at ${startTime.toLocaleTimeString()}`);
          } else if (arrivalTime > endTime) {
            conflicts.push(`Stop for order ${order.id}: Estimated arrival at ${arrivalTime.toLocaleTimeString()} is after the time window ends at ${endTime.toLocaleTimeString()}`);
          }
        }
      }
      
      return conflicts;
    } catch (error) {
      console.error('Error detecting time window conflicts:', error);
      throw new Error(`Failed to detect time window conflicts: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Optimizes the sequence of stops in a route to minimize time window conflicts
   * @param routeId The route ID
   * @param orders Array of orders with time windows
   * @returns Optimized route or null if route not found
   */
  async optimizeRouteSequence(routeId: string, orders: any[]): Promise<Route | null> {
    try {
      const route = await this.routeRepository.findById(routeId);
      if (!route) {
        return null;
      }
      
      // Find the optimal sequence of stops
      const optimizedStops = await this.findOptimalSequence(route.stops, orders);
      
      // Update the route with the optimized stops
      const routeWithOptimizedStops = await this.routeRepository.updateStops(routeId, optimizedStops);
      
      // Recalculate route metrics
      const { totalDistance, estimatedDuration } = await MapsService.calculateRouteMetrics(optimizedStops);
      
      // Update the route metrics
      return await this.routeRepository.updateRouteMetrics(routeId, totalDistance, estimatedDuration);
    } catch (error) {
      console.error('Error optimizing route sequence:', error);
      throw new Error(`Failed to optimize route sequence: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Finds the optimal sequence of stops to minimize time window conflicts
   * @param stops Array of route stops
   * @param orders Array of orders with time windows
   * @returns Optimized array of stops
   */
  private async findOptimalSequence(stops: any[], orders: any[]): Promise<any[]> {
    // Get orders with time windows
    const ordersWithTimeWindows = orders.filter(o => o.timeWindow);
    
    if (ordersWithTimeWindows.length === 0) {
      // No time windows to optimize for
      return stops;
    }
    
    // Sort stops by time window start time
    const stopsWithTimeWindows = stops.map(stop => {
      const order = orders.find(o => o.id === stop.orderId);
      return {
        stop,
        timeWindow: order?.timeWindow
      };
    });
    
    // Sort by time window start time (if available)
    stopsWithTimeWindows.sort((a, b) => {
      if (!a.timeWindow && !b.timeWindow) return 0;
      if (!a.timeWindow) return 1;
      if (!b.timeWindow) return -1;
      return a.timeWindow.startTime.getTime() - b.timeWindow.startTime.getTime();
    });
    
    // Create optimized stops with updated sequence
    const optimizedStops = stopsWithTimeWindows.map((item, index) => ({
      ...item.stop,
      sequence: index
    }));
    
    // Calculate estimated arrival times for the optimized sequence
    return await MapsService.calculateEstimatedTravelTimes(optimizedStops);
  }
  
  /**
   * Invalidates all caches related to a specific route
   * @param routeId The route ID
   */
  private async invalidateRouteCaches(routeId: string): Promise<void> {
    try {
      // Invalidate route cache
      await RedisService.del(`${this.ROUTE_CACHE_PREFIX}${routeId}`);
      
      // Invalidate route map cache
      await RedisService.del(`${this.ROUTE_MAP_CACHE_PREFIX}${routeId}`);
      
      // Invalidate turn-by-turn directions cache
      await RedisService.del(`${this.TURN_BY_TURN_CACHE_PREFIX}${routeId}`);
      
      console.log(`Caches invalidated for route: ${routeId}`);
    } catch (error) {
      console.error(`Error invalidating caches for route ${routeId}:`, error);
    }
  }
}

export default RouteService;
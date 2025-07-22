import { Order, Vehicle, Route, RouteStop, RouteStatus, TimeWindow } from '../../../shared/types';
import { MapService } from './MapService';
import { v4 as uuidv4 } from 'uuid';

// Define interfaces for the VRP problem
interface DeliveryPoint {
  id: string;
  orderId: string;
  demand: number;
  timeWindow?: TimeWindow;
  serviceTime: number;
  location: {
    latitude: number;
    longitude: number;
  };
}

interface VehicleCapacity {
  id: string;
  capacity: number;
  maxStops?: number;
  startLocation: number; // Index in locations array
  endLocation: number; // Index in locations array
}

interface VRPProblem {
  deliveryPoints: DeliveryPoint[];
  vehicles: VehicleCapacity[];
  distanceMatrix: number[][];
  depot: {
    latitude: number;
    longitude: number;
  };
}

interface VRPSolution {
  routes: number[][];
  unassigned: number[];
}

export class RouteOptimizationService {
  constructor(private mapService: MapService) { }

  /**
   * Optimizes routes for a set of orders and available vehicles
   */
  async optimizeRoutes(
    orders: Order[],
    vehicles: Vehicle[],
    depotLocation: { latitude: number; longitude: number }
  ): Promise<Route[]> {
    // 1. Calculate distance matrix between all points
    const locations = [depotLocation, ...orders.map(order => order.deliveryAddress.coordinates)];
    const distanceMatrix = await this.mapService.calculateDistanceMatrix(locations);

    // 2. Set up VRP problem
    const vrpProblem = this.setupVRPProblem(orders, vehicles, distanceMatrix, depotLocation);

    // 3. Solve the VRP problem
    const solution = this.solveVRP(vrpProblem);

    // 4. Convert solution to routes
    return this.convertSolutionToRoutes(solution, vrpProblem, orders, vehicles);
  }

  /**
   * Sets up the VRP problem with constraints
   */
  private setupVRPProblem(
    orders: Order[],
    vehicles: Vehicle[],
    distanceMatrix: number[][],
    depot: { latitude: number; longitude: number }
  ): VRPProblem {
    // Transform orders into delivery points
    const deliveryPoints: DeliveryPoint[] = orders.map((order, index) => ({
      id: `point-${index + 1}`,
      orderId: order.id,
      demand: this.calculateTotalWeight(order.packageDetails),
      timeWindow: order.timeWindow,
      serviceTime: this.estimateServiceTime(order),
      location: order.deliveryAddress.coordinates
    }));

    // Transform vehicles into capacity constraints
    const vehicleCapacities: VehicleCapacity[] = vehicles.map((vehicle, index) => ({
      id: vehicle.id,
      capacity: vehicle.capacity.maxWeight,
      maxStops: vehicle.capacity.maxPackages,
      startLocation: 0, // Index of depot in locations array
      endLocation: 0
    }));

    return {
      deliveryPoints,
      vehicles: vehicleCapacities,
      distanceMatrix,
      depot
    };
  }

  /**
   * Solves the VRP problem using a selected algorithm
   */
  private solveVRP(problem: VRPProblem): VRPSolution {
    // For this implementation, we'll use the Clarke-Wright savings algorithm
    return this.clarkeWrightSavings(problem);
  }

  /**
   * Clarke-Wright savings algorithm implementation
   * This is a heuristic algorithm for solving the VRP
   */
  private clarkeWrightSavings(problem: VRPProblem): VRPSolution {
    const { deliveryPoints, vehicles, distanceMatrix } = problem;
    const depot = 0; // Index of depot in the distance matrix

    // Calculate savings for each pair of delivery points
    const savings = [];
    for (let i = 1; i <= deliveryPoints.length; i++) {
      for (let j = i + 1; j <= deliveryPoints.length; j++) {
        // Savings formula: s(i,j) = d(0,i) + d(0,j) - d(i,j)
        const saving = distanceMatrix[depot][i] + distanceMatrix[depot][j] - distanceMatrix[i][j];
        savings.push({ i, j, saving });
      }
    }

    // Sort savings in descending order
    savings.sort((a, b) => b.saving - a.saving);

    // Initialize routes (one per delivery point)
    const routes: number[][] = deliveryPoints.map((_, index) => [index + 1]);

    // Track which route each point belongs to
    const routeMap = new Map<number, number>();
    deliveryPoints.forEach((_, index) => {
      routeMap.set(index + 1, index);
    });

    // Track total demand for each route
    const routeDemand = deliveryPoints.map(point => point.demand);

    // Track if a point is at the start or end of its route
    const isStart = new Array(deliveryPoints.length + 1).fill(true);
    const isEnd = new Array(deliveryPoints.length + 1).fill(true);

    // Merge routes based on savings
    for (const { i, j, saving } of savings) {
      // Skip if saving is negative
      if (saving <= 0) continue;

      // Find routes containing i and j
      const routeWithI = routeMap.get(i)!;
      const routeWithJ = routeMap.get(j)!;

      // Skip if i and j are already in the same route
      if (routeWithI === routeWithJ) continue;

      // Check if i and j are at the ends of their routes
      const iAtStart = isStart[i];
      const iAtEnd = isEnd[i];
      const jAtStart = isStart[j];
      const jAtEnd = isEnd[j];

      // Skip if neither point is at an end of its route
      if ((!iAtStart && !iAtEnd) || (!jAtStart && !jAtEnd)) continue;

      // Check capacity constraints
      const mergedDemand = routeDemand[routeWithI] + routeDemand[routeWithJ];

      // Skip if merged route would exceed vehicle capacity
      if (mergedDemand > vehicles[0].capacity) continue;

      // Merge routes
      let newRoute: number[] = [];

      if (iAtEnd && jAtStart) {
        // i is at the end of its route, j is at the start of its route
        newRoute = [...routes[routeWithI], ...routes[routeWithJ]];
      } else if (iAtStart && jAtEnd) {
        // i is at the start of its route, j is at the end of its route
        newRoute = [...routes[routeWithJ], ...routes[routeWithI]];
      } else if (iAtStart && jAtStart) {
        // Both i and j are at the start of their routes
        newRoute = [...routes[routeWithI].reverse(), ...routes[routeWithJ]];
      } else if (iAtEnd && jAtEnd) {
        // Both i and j are at the end of their routes
        newRoute = [...routes[routeWithI], ...routes[routeWithJ].reverse()];
      }

      if (newRoute.length > 0) {
        // Update route data
        routes[routeWithI] = newRoute;
        routeDemand[routeWithI] = mergedDemand;

        // Remove the merged route
        routes[routeWithJ] = [];
        routeDemand[routeWithJ] = 0;

        // Update route map for all points in the merged route
        newRoute.forEach(point => {
          routeMap.set(point, routeWithI);
        });

        // Update start/end flags
        isStart[newRoute[0]] = true;
        isEnd[newRoute[newRoute.length - 1]] = true;

        for (let k = 1; k < newRoute.length; k++) {
          isStart[newRoute[k]] = false;
        }

        for (let k = 0; k < newRoute.length - 1; k++) {
          isEnd[newRoute[k]] = false;
        }
      }
    }

    // Filter out empty routes
    const finalRoutes = routes.filter(route => route.length > 0);

    // Add depot at the start and end of each route
    const routesWithDepot = finalRoutes.map(route => [0, ...route, 0]);

    // Check for unassigned points (should not happen with this implementation)
    const assigned = new Set<number>();
    routesWithDepot.forEach(route => {
      route.forEach(point => {
        if (point !== 0) assigned.add(point);
      });
    });

    const unassigned: number[] = [];
    for (let i = 1; i <= deliveryPoints.length; i++) {
      if (!assigned.has(i)) unassigned.push(i);
    }

    return {
      routes: routesWithDepot,
      unassigned
    };
  }

  /**
   * Converts the VRP solution to Route objects
   */
  private convertSolutionToRoutes(
    solution: VRPSolution,
    problem: VRPProblem,
    orders: Order[],
    vehicles: Vehicle[]
  ): Route[] {
    const { routes, unassigned } = solution;
    const { distanceMatrix, deliveryPoints } = problem;

    // Handle unassigned points if needed
    if (unassigned.length > 0) {
      console.warn(`${unassigned.length} delivery points could not be assigned to routes`);
    }

    // Create routes from solution
    return routes.map((route, routeIndex) => {
      // Skip depot at start and end (indices 0 and route.length-1)
      const stops: RouteStop[] = route.slice(1, -1).map((pointIndex, sequenceIndex) => {
        // Find the order corresponding to this point
        const deliveryPoint = deliveryPoints[pointIndex - 1];
        const order = orders.find(o => o.id === deliveryPoint.orderId)!;

        return {
          orderId: order.id,
          address: order.deliveryAddress,
          sequence: sequenceIndex,
          estimatedArrival: new Date() // Would calculate based on distances and times
        };
      });

      // Assign a vehicle to this route
      const vehicleIndex = routeIndex % vehicles.length;
      const vehicle = vehicles[vehicleIndex];

      // Calculate total distance and duration
      const totalDistance = this.calculateRouteDistance(route, distanceMatrix);
      const estimatedDuration = this.calculateRouteDuration(route, distanceMatrix);

      return {
        id: uuidv4(),
        loadId: `load-${uuidv4()}`, // Would be an actual load ID in a real implementation
        vehicleId: vehicle.id,
        stops,
        totalDistance,
        estimatedDuration,
        status: RouteStatus.PLANNED,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
  }

  /**
   * Validates a route for time window conflicts
   * @returns Array of conflict descriptions
   */
  async validateRouteTimeWindows(route: Route, orders: Order[]): Promise<string[]> {
    const conflicts: string[] = [];

    // Get estimated arrival times for each stop
    const arrivalTimes = await this.calculateEstimatedArrivalTimes(route);

    // Check each stop against its time window
    for (let i = 0; i < route.stops.length; i++) {
      const stop = route.stops[i];
      const order = orders.find(o => o.id === stop.orderId);

      if (order && order.timeWindow) {
        const arrivalTime = arrivalTimes[i];
        const { startTime, endTime } = order.timeWindow;

        // Check if arrival time is outside the time window
        if (arrivalTime < startTime) {
          conflicts.push(`Stop ${i + 1} (Order ${order.id}): Estimated arrival at ${arrivalTime.toLocaleTimeString()} is before the time window starts at ${startTime.toLocaleTimeString()}`);
        } else if (arrivalTime > endTime) {
          conflicts.push(`Stop ${i + 1} (Order ${order.id}): Estimated arrival at ${arrivalTime.toLocaleTimeString()} is after the time window ends at ${endTime.toLocaleTimeString()}`);
        }
      }
    }

    return conflicts;
  }

  /**
   * Calculates estimated arrival times for each stop in a route
   */
  private async calculateEstimatedArrivalTimes(route: Route): Promise<Date[]> {
    // This is a simplified implementation
    // In a real system, you would use the Maps API to get accurate travel times

    const arrivalTimes: Date[] = [];
    let currentTime = new Date();

    // Assume we start now
    for (const stop of route.stops) {
      // Add travel time to this stop (simplified)
      currentTime = new Date(currentTime.getTime() + 15 * 60 * 1000); // 15 minutes per stop

      arrivalTimes.push(new Date(currentTime));

      // Add service time at this stop
      currentTime = new Date(currentTime.getTime() + 10 * 60 * 1000); // 10 minutes service time
    }

    return arrivalTimes;
  }

  /**
   * Generates turn-by-turn directions for a route
   */
  async generateTurnByTurnDirections(route: Route): Promise<any> {
    // Extract locations from route stops
    const waypoints = route.stops.map(stop => stop.address.coordinates);

    // Add depot location at start and end (simplified)
    const depotLocation = { latitude: 37.7749, longitude: -122.4194 }; // Example depot location
    const allWaypoints = [depotLocation, ...waypoints, depotLocation];

    // Get directions from Maps API
    return this.mapService.getDirections(allWaypoints);
  }

  /**
   * Suggests alternative routes when conflicts are detected
   */
  async suggestAlternativeRoutes(route: Route, orders: Order[], vehicles: Vehicle[]): Promise<Route[]> {
    // This is a simplified implementation
    // In a real system, you would use more sophisticated algorithms

    // Try a simple reordering of stops
    const alternativeRoutes: Route[] = [];

    // Create a new route with reversed stop order
    const reversedStops = [...route.stops].reverse().map((stop, index) => ({
      ...stop,
      sequence: index
    }));

    const reversedRoute: Route = {
      ...route,
      id: `${route.id}-alt1`,
      stops: reversedStops,
      updatedAt: new Date()
    };

    alternativeRoutes.push(reversedRoute);

    // Create another alternative by swapping some stops
    if (route.stops.length >= 4) {
      const swappedStops = [...route.stops];
      // Swap first and last stops
      [swappedStops[0], swappedStops[swappedStops.length - 1]] =
        [swappedStops[swappedStops.length - 1], swappedStops[0]];

      // Update sequences
      swappedStops.forEach((stop, index) => {
        stop.sequence = index;
      });

      const swappedRoute: Route = {
        ...route,
        id: `${route.id}-alt2`,
        stops: swappedStops,
        updatedAt: new Date()
      };

      alternativeRoutes.push(swappedRoute);
    }

    return alternativeRoutes;
  }

  // Helper methods
  private calculateTotalWeight(packages: any[]): number {
    return packages.reduce((sum, pkg) => sum + pkg.weight, 0);
  }

  private estimateServiceTime(order: Order): number {
    // Base service time plus additional time for multiple packages
    return 5 + order.packageDetails.length * 2; // minutes
  }

  private calculateRouteDistance(route: number[], distanceMatrix: number[][]): number {
    let distance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      distance += distanceMatrix[route[i]][route[i + 1]];
    }
    return distance;
  }

  private calculateRouteDuration(route: number[], distanceMatrix: number[][]): number {
    // Simplified calculation: assume 30 km/h average speed
    const distance = this.calculateRouteDistance(route, distanceMatrix);
    return (distance / 30) * 60; // minutes
  }
}
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteService = void 0;
const types_1 = require("../../../shared/types");
const RouteRepository_1 = require("../../../shared/database/repositories/RouteRepository");
const MapsService_1 = __importDefault(require("./MapsService"));
const RedisService_1 = __importDefault(require("./RedisService"));
class RouteService {
    constructor(pool) {
        this.CACHE_TTL = 3600;
        this.ROUTE_CACHE_PREFIX = 'route:';
        this.ROUTE_MAP_CACHE_PREFIX = 'route_map:';
        this.TURN_BY_TURN_CACHE_PREFIX = 'turn_by_turn:';
        this.routeRepository = new RouteRepository_1.RouteRepository(pool);
    }
    async createRoute(loadId, vehicleId, stops) {
        try {
            const { totalDistance, estimatedDuration } = await MapsService_1.default.calculateRouteMetrics(stops);
            const stopsWithTimes = await MapsService_1.default.calculateEstimatedTravelTimes(stops);
            const route = {
                loadId,
                vehicleId,
                stops: stopsWithTimes,
                totalDistance,
                estimatedDuration,
                status: types_1.RouteStatus.PLANNED
            };
            return await this.routeRepository.create(route);
        }
        catch (error) {
            console.error('Error creating route:', error);
            throw new Error(`Failed to create route: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getRouteById(id) {
        const cacheKey = `${this.ROUTE_CACHE_PREFIX}${id}`;
        const cachedRoute = await RedisService_1.default.getJson(cacheKey);
        if (cachedRoute) {
            console.log(`Cache hit for route: ${id}`);
            return cachedRoute;
        }
        console.log(`Cache miss for route: ${id}`);
        const route = await this.routeRepository.findById(id);
        if (route) {
            await RedisService_1.default.setJson(cacheKey, route, this.CACHE_TTL);
        }
        return route;
    }
    async getAllRoutes() {
        return await this.routeRepository.findAll();
    }
    async getRoutesByStatus(status) {
        return await this.routeRepository.findByStatus(status);
    }
    async getRouteByLoadId(loadId) {
        return await this.routeRepository.findByLoadId(loadId);
    }
    async getRoutesByVehicleId(vehicleId) {
        return await this.routeRepository.findByVehicleId(vehicleId);
    }
    async updateRouteStops(id, stops) {
        try {
            const route = await this.routeRepository.findById(id);
            if (!route) {
                return null;
            }
            const { totalDistance, estimatedDuration } = await MapsService_1.default.calculateRouteMetrics(stops);
            const stopsWithTimes = await MapsService_1.default.calculateEstimatedTravelTimes(stops);
            await this.routeRepository.updateStops(id, stopsWithTimes);
            const updatedRoute = await this.routeRepository.updateRouteMetrics(id, totalDistance, estimatedDuration);
            await this.invalidateRouteCaches(id);
            return updatedRoute;
        }
        catch (error) {
            console.error('Error updating route stops:', error);
            throw new Error(`Failed to update route stops: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async updateRouteStatus(id, status) {
        const updatedRoute = await this.routeRepository.updateStatus(id, status);
        if (updatedRoute) {
            await this.invalidateRouteCaches(id);
        }
        return updatedRoute;
    }
    async geocodeAddress(address) {
        return await MapsService_1.default.geocodeAddress(address);
    }
    async calculateDistance(origin, destination) {
        try {
            const directions = await MapsService_1.default.getDirections(origin, destination);
            return {
                distance: directions.distance,
                duration: directions.duration
            };
        }
        catch (error) {
            console.error('Error calculating distance:', error);
            throw new Error(`Failed to calculate distance: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async generateTurnByTurnDirections(routeId) {
        try {
            const cacheKey = `${this.TURN_BY_TURN_CACHE_PREFIX}${routeId}`;
            const cachedDirections = await RedisService_1.default.getJson(cacheKey);
            if (cachedDirections) {
                console.log(`Cache hit for turn-by-turn directions: ${routeId}`);
                return cachedDirections;
            }
            console.log(`Cache miss for turn-by-turn directions: ${routeId}`);
            const route = await this.routeRepository.findById(routeId);
            if (!route) {
                throw new Error(`Route not found with ID: ${routeId}`);
            }
            const directions = await MapsService_1.default.generateTurnByTurnDirections(route.stops);
            await RedisService_1.default.setJson(cacheKey, directions, this.CACHE_TTL);
            return directions;
        }
        catch (error) {
            console.error('Error generating turn-by-turn directions:', error);
            throw new Error(`Failed to generate directions: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async calculateEstimatedTravelTimes(routeId, startTime) {
        try {
            const route = await this.routeRepository.findById(routeId);
            if (!route) {
                return null;
            }
            const stopsWithTimes = await MapsService_1.default.calculateEstimatedTravelTimes(route.stops, startTime || new Date());
            return await this.routeRepository.updateStops(routeId, stopsWithTimes);
        }
        catch (error) {
            console.error('Error calculating estimated travel times:', error);
            throw new Error(`Failed to calculate travel times: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async recalculateArrivalTimes(routeId, startTime) {
        return this.calculateEstimatedTravelTimes(routeId, startTime);
    }
    async generateRouteMapData(routeId) {
        try {
            const cacheKey = `${this.ROUTE_MAP_CACHE_PREFIX}${routeId}`;
            const cachedMapData = await RedisService_1.default.getJson(cacheKey);
            if (cachedMapData) {
                console.log(`Cache hit for route map data: ${routeId}`);
                return {
                    ...cachedMapData,
                    waypoints: cachedMapData.waypoints.map(wp => ({
                        ...wp,
                        estimatedArrival: new Date(wp.estimatedArrival)
                    }))
                };
            }
            console.log(`Cache miss for route map data: ${routeId}`);
            const route = await this.routeRepository.findById(routeId);
            if (!route) {
                throw new Error(`Route not found with ID: ${routeId}`);
            }
            const sortedStops = [...route.stops].sort((a, b) => a.sequence - b.sequence);
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
                await RedisService_1.default.setJson(cacheKey, result, this.CACHE_TTL);
                return result;
            }
            let polyline = '';
            if (locations.length >= 2) {
                const origin = locations[0];
                const destination = locations[locations.length - 1];
                const waypoints = locations.slice(1, -1);
                try {
                    const directions = await MapsService_1.default.getDirections(origin, destination, waypoints);
                    polyline = directions.polyline;
                }
                catch (error) {
                    console.error('Error getting directions for route map:', error);
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
            await RedisService_1.default.setJson(cacheKey, result, this.CACHE_TTL);
            return result;
        }
        catch (error) {
            console.error('Error generating route map data:', error);
            throw new Error(`Failed to generate route map data: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async reorderRouteStops(routeId, stopOrder) {
        try {
            const route = await this.routeRepository.findById(routeId);
            if (!route) {
                return null;
            }
            const orderIds = new Set(route.stops.map(stop => stop.orderId));
            const allOrderIdsExist = stopOrder.every(orderId => orderIds.has(orderId));
            if (!allOrderIdsExist) {
                throw new Error('Invalid stop order: contains orderIds that do not exist in the route');
            }
            const stopMap = new Map(route.stops.map(stop => [stop.orderId, stop]));
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
            route.stops.forEach(stop => {
                if (!stopOrder.includes(stop.orderId)) {
                    updatedStops.push({
                        ...stop,
                        sequence: updatedStops.length
                    });
                }
            });
            return await this.updateRouteStops(routeId, updatedStops);
        }
        catch (error) {
            console.error('Error reordering route stops:', error);
            throw new Error(`Failed to reorder route stops: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async validateTimeWindows(routeId, orders) {
        try {
            const route = await this.routeRepository.findById(routeId);
            if (!route) {
                return null;
            }
            return this.detectTimeWindowConflicts(route, orders);
        }
        catch (error) {
            console.error('Error validating time windows:', error);
            throw new Error(`Failed to validate time windows: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async detectTimeWindowConflicts(routeOrId, orders) {
        try {
            let route;
            if (typeof routeOrId === 'string') {
                route = await this.routeRepository.findById(routeOrId);
                if (!route) {
                    return null;
                }
            }
            else {
                route = routeOrId;
            }
            const conflicts = [];
            for (const stop of route.stops) {
                const order = orders.find(o => o.id === stop.orderId);
                if (order && order.timeWindow) {
                    const arrivalTime = stop.estimatedArrival;
                    const { startTime, endTime } = order.timeWindow;
                    if (arrivalTime < startTime) {
                        conflicts.push(`Stop for order ${order.id}: Estimated arrival at ${arrivalTime.toLocaleTimeString()} is before the time window starts at ${startTime.toLocaleTimeString()}`);
                    }
                    else if (arrivalTime > endTime) {
                        conflicts.push(`Stop for order ${order.id}: Estimated arrival at ${arrivalTime.toLocaleTimeString()} is after the time window ends at ${endTime.toLocaleTimeString()}`);
                    }
                }
            }
            return conflicts;
        }
        catch (error) {
            console.error('Error detecting time window conflicts:', error);
            throw new Error(`Failed to detect time window conflicts: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async optimizeRouteSequence(routeId, orders) {
        try {
            const route = await this.routeRepository.findById(routeId);
            if (!route) {
                return null;
            }
            const optimizedStops = await this.findOptimalSequence(route.stops, orders);
            const routeWithOptimizedStops = await this.routeRepository.updateStops(routeId, optimizedStops);
            const { totalDistance, estimatedDuration } = await MapsService_1.default.calculateRouteMetrics(optimizedStops);
            return await this.routeRepository.updateRouteMetrics(routeId, totalDistance, estimatedDuration);
        }
        catch (error) {
            console.error('Error optimizing route sequence:', error);
            throw new Error(`Failed to optimize route sequence: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async findOptimalSequence(stops, orders) {
        const ordersWithTimeWindows = orders.filter(o => o.timeWindow);
        if (ordersWithTimeWindows.length === 0) {
            return stops;
        }
        const stopsWithTimeWindows = stops.map(stop => {
            const order = orders.find(o => o.id === stop.orderId);
            return {
                stop,
                timeWindow: order?.timeWindow
            };
        });
        stopsWithTimeWindows.sort((a, b) => {
            if (!a.timeWindow && !b.timeWindow)
                return 0;
            if (!a.timeWindow)
                return 1;
            if (!b.timeWindow)
                return -1;
            return a.timeWindow.startTime.getTime() - b.timeWindow.startTime.getTime();
        });
        const optimizedStops = stopsWithTimeWindows.map((item, index) => ({
            ...item.stop,
            sequence: index
        }));
        return await MapsService_1.default.calculateEstimatedTravelTimes(optimizedStops);
    }
    async invalidateRouteCaches(routeId) {
        try {
            await RedisService_1.default.del(`${this.ROUTE_CACHE_PREFIX}${routeId}`);
            await RedisService_1.default.del(`${this.ROUTE_MAP_CACHE_PREFIX}${routeId}`);
            await RedisService_1.default.del(`${this.TURN_BY_TURN_CACHE_PREFIX}${routeId}`);
            console.log(`Caches invalidated for route: ${routeId}`);
        }
        catch (error) {
            console.error(`Error invalidating caches for route ${routeId}:`, error);
        }
    }
}
exports.RouteService = RouteService;
exports.default = RouteService;
//# sourceMappingURL=RouteService.js.map
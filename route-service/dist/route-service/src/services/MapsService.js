"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapsService = void 0;
const google_maps_services_js_1 = require("@googlemaps/google-maps-services-js");
const RedisService_1 = __importDefault(require("./RedisService"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class MapsService {
    constructor() {
        this.CACHE_TTL = 86400;
        this.GEOCODE_CACHE_PREFIX = 'geocode:';
        this.DIRECTIONS_CACHE_PREFIX = 'directions:';
        this.DISTANCE_MATRIX_CACHE_PREFIX = 'distance_matrix:';
        this.client = new google_maps_services_js_1.Client({});
        this.apiKey = process.env.MAPS_API_KEY || '';
        if (!this.apiKey) {
            console.warn('Maps API key not found. Map functionality will be limited.');
        }
    }
    async geocodeAddress(address) {
        try {
            const addressString = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
            const cacheKey = `${this.GEOCODE_CACHE_PREFIX}${Buffer.from(addressString).toString('base64')}`;
            const cachedLocation = await RedisService_1.default.getJson(cacheKey);
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
            await RedisService_1.default.setJson(cacheKey, result, this.CACHE_TTL);
            return result;
        }
        catch (error) {
            console.error('Error geocoding address:', error);
            throw new Error(`Failed to geocode address: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getDirections(origin, destination, waypoints) {
        try {
            const originStr = `${origin.latitude.toFixed(6)},${origin.longitude.toFixed(6)}`;
            const destStr = `${destination.latitude.toFixed(6)},${destination.longitude.toFixed(6)}`;
            let waypointsStr = '';
            if (waypoints && waypoints.length > 0) {
                waypointsStr = waypoints
                    .map(wp => `${wp.latitude.toFixed(6)},${wp.longitude.toFixed(6)}`)
                    .join('|');
            }
            const cacheKey = `${this.DIRECTIONS_CACHE_PREFIX}${Buffer.from(`${originStr}|${destStr}|${waypointsStr}`).toString('base64')}`;
            const cachedDirections = await RedisService_1.default.getJson(cacheKey);
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
                    mode: google_maps_services_js_1.TravelMode.driving,
                    units: google_maps_services_js_1.UnitSystem.metric,
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
            const steps = [];
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
            const directionsCacheTTL = 3600;
            await RedisService_1.default.setJson(cacheKey, result, directionsCacheTTL);
            return result;
        }
        catch (error) {
            console.error('Error getting directions:', error);
            throw new Error(`Failed to get directions: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getDistanceMatrix(origins, destinations) {
        try {
            const originsHash = origins
                .map(loc => `${loc.latitude.toFixed(6)},${loc.longitude.toFixed(6)}`)
                .join('|');
            const destinationsHash = destinations
                .map(loc => `${loc.latitude.toFixed(6)},${loc.longitude.toFixed(6)}`)
                .join('|');
            const cacheKey = `${this.DISTANCE_MATRIX_CACHE_PREFIX}${Buffer.from(`${originsHash}|${destinationsHash}`).toString('base64')}`;
            const cachedMatrix = await RedisService_1.default.getJson(cacheKey);
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
                    mode: google_maps_services_js_1.TravelMode.driving,
                    units: google_maps_services_js_1.UnitSystem.metric,
                    key: this.apiKey
                }
            });
            const rows = response.data.rows;
            const distances = [];
            const durations = [];
            rows.forEach(row => {
                const distanceRow = [];
                const durationRow = [];
                row.elements.forEach(element => {
                    if (element.status === 'OK') {
                        distanceRow.push(element.distance.value);
                        durationRow.push(element.duration.value);
                    }
                    else {
                        distanceRow.push(-1);
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
            const matrixCacheTTL = 3600;
            await RedisService_1.default.setJson(cacheKey, result, matrixCacheTTL);
            return result;
        }
        catch (error) {
            console.error('Error getting distance matrix:', error);
            throw new Error(`Failed to get distance matrix: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async calculateEstimatedTravelTimes(stops, startTime = new Date()) {
        if (stops.length <= 1) {
            return stops;
        }
        const sortedStops = [...stops].sort((a, b) => a.sequence - b.sequence);
        const locations = sortedStops.map(stop => stop.address.coordinates);
        const distanceMatrix = await this.getDistanceMatrix(locations, locations);
        let currentTime = new Date(startTime.getTime());
        const updatedStops = [];
        for (let i = 0; i < sortedStops.length; i++) {
            const stop = { ...sortedStops[i] };
            if (i === 0) {
                stop.estimatedArrival = new Date(currentTime.getTime());
            }
            else {
                const prevIndex = i - 1;
                const travelTimeSeconds = distanceMatrix.durations[prevIndex][i];
                if (travelTimeSeconds > 0) {
                    currentTime = new Date(currentTime.getTime() + travelTimeSeconds * 1000);
                    stop.estimatedArrival = new Date(currentTime.getTime());
                }
                else {
                    currentTime = new Date(currentTime.getTime() + 10 * 60 * 1000);
                    stop.estimatedArrival = new Date(currentTime.getTime());
                }
            }
            currentTime = new Date(currentTime.getTime() + 5 * 60 * 1000);
            updatedStops.push(stop);
        }
        return updatedStops;
    }
    async calculateRouteMetrics(stops) {
        if (stops.length <= 1) {
            return { totalDistance: 0, estimatedDuration: 0 };
        }
        const sortedStops = [...stops].sort((a, b) => a.sequence - b.sequence);
        const locations = sortedStops.map(stop => stop.address.coordinates);
        const distanceMatrix = await this.getDistanceMatrix(locations, locations);
        let totalDistance = 0;
        let totalDuration = 0;
        for (let i = 0; i < sortedStops.length - 1; i++) {
            const nextIndex = i + 1;
            const distance = distanceMatrix.distances[i][nextIndex];
            const duration = distanceMatrix.durations[i][nextIndex];
            if (distance > 0 && duration > 0) {
                totalDistance += distance;
                totalDuration += duration;
            }
        }
        totalDuration += sortedStops.length * 5 * 60;
        return { totalDistance, estimatedDuration: totalDuration };
    }
    async generateTurnByTurnDirections(stops) {
        if (stops.length <= 1) {
            return [];
        }
        const sortedStops = [...stops].sort((a, b) => a.sequence - b.sequence);
        const directions = [];
        for (let i = 0; i < sortedStops.length - 1; i++) {
            const origin = sortedStops[i].address.coordinates;
            const destination = sortedStops[i + 1].address.coordinates;
            try {
                const result = await this.getDirections(origin, destination);
                directions.push(result.steps);
            }
            catch (error) {
                console.error(`Error getting directions between stops ${i} and ${i + 1}:`, error);
                directions.push([]);
            }
        }
        return directions;
    }
    async invalidateRouteCaches() {
        try {
            await RedisService_1.default.invalidatePattern(`${this.DIRECTIONS_CACHE_PREFIX}*`);
            await RedisService_1.default.invalidatePattern(`${this.DISTANCE_MATRIX_CACHE_PREFIX}*`);
            console.log('Route caches invalidated successfully');
        }
        catch (error) {
            console.error('Error invalidating route caches:', error);
        }
    }
}
exports.MapsService = MapsService;
exports.default = new MapsService();
//# sourceMappingURL=MapsService.js.map
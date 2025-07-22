"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapService = void 0;
const google_maps_services_js_1 = require("@googlemaps/google-maps-services-js");
class MapService {
    getDirections(allWaypoints) {
        throw new Error('Method not implemented.');
    }
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.mapsClient = new google_maps_services_js_1.Client({});
    }
    async calculateDistanceMatrix(locations) {
        try {
            if (locations.length === 0) {
                return [];
            }
            const origins = locations.map(loc => ({ lat: loc.latitude, lng: loc.longitude }));
            const destinations = origins;
            const response = await this.mapsClient.distancematrix({
                params: {
                    origins,
                    destinations,
                    key: this.apiKey,
                    mode: google_maps_services_js_1.TravelMode.driving
                }
            });
            const { rows } = response.data;
            return rows.map(row => row.elements.map(element => element.distance.value / 1000));
        }
        catch (error) {
            console.error('Error calculating distance matrix:', error);
            throw new Error('Failed to calculate distances between locations');
        }
    }
    async calculateTravelTime(origin, destination) {
        try {
            const response = await this.mapsClient.distancematrix({
                params: {
                    origins: [{ lat: origin.latitude, lng: origin.longitude }],
                    destinations: [{ lat: destination.latitude, lng: destination.longitude }],
                    key: this.apiKey,
                    mode: google_maps_services_js_1.TravelMode.driving
                }
            });
            return response.data.rows[0].elements[0].duration.value / 60;
        }
        catch (error) {
            console.error('Error calculating travel time:', error);
            throw new Error('Failed to calculate travel time between locations');
        }
    }
}
exports.MapService = MapService;
//# sourceMappingURL=MapService.js.map
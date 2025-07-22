"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteController = void 0;
const RouteService_1 = __importDefault(require("../services/RouteService"));
const types_1 = require("../../../shared/types");
class RouteController {
    constructor(pool) {
        this.routeService = new RouteService_1.default(pool);
    }
    async createRoute(req, res) {
        try {
            const { loadId, vehicleId, stops } = req.body;
            if (!loadId || !vehicleId || !stops || !Array.isArray(stops)) {
                res.status(400).json({ error: 'Invalid request. loadId, vehicleId, and stops array are required.' });
                return;
            }
            const route = await this.routeService.createRoute(loadId, vehicleId, stops);
            res.status(201).json(route);
        }
        catch (error) {
            console.error('Error in createRoute controller:', error);
            res.status(500).json({
                error: 'Failed to create route',
                message: error instanceof Error ? error.message : String(error)
            });
        }
    }
    async getRoute(req, res) {
        try {
            const { id } = req.params;
            const route = await this.routeService.getRouteById(id);
            if (!route) {
                res.status(404).json({ error: `Route not found with ID: ${id}` });
                return;
            }
            res.status(200).json(route);
        }
        catch (error) {
            console.error('Error in getRoute controller:', error);
            res.status(500).json({
                error: 'Failed to get route',
                message: error instanceof Error ? error.message : String(error)
            });
        }
    }
    async getRoutes(req, res) {
        try {
            const { status } = req.query;
            let routes;
            if (status && Object.values(types_1.RouteStatus).includes(status)) {
                routes = await this.routeService.getRoutesByStatus(status);
            }
            else {
                routes = await this.routeService.getAllRoutes();
            }
            res.status(200).json(routes);
        }
        catch (error) {
            console.error('Error in getRoutes controller:', error);
            res.status(500).json({
                error: 'Failed to get routes',
                message: error instanceof Error ? error.message : String(error)
            });
        }
    }
    async updateRouteStops(req, res) {
        try {
            const { id } = req.params;
            const { stops } = req.body;
            if (!stops || !Array.isArray(stops)) {
                res.status(400).json({ error: 'Invalid request. stops array is required.' });
                return;
            }
            const updatedRoute = await this.routeService.updateRouteStops(id, stops);
            if (!updatedRoute) {
                res.status(404).json({ error: `Route not found with ID: ${id}` });
                return;
            }
            res.status(200).json(updatedRoute);
        }
        catch (error) {
            console.error('Error in updateRouteStops controller:', error);
            res.status(500).json({
                error: 'Failed to update route stops',
                message: error instanceof Error ? error.message : String(error)
            });
        }
    }
    async updateRouteStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!status || !Object.values(types_1.RouteStatus).includes(status)) {
                res.status(400).json({
                    error: 'Invalid status. Must be one of: ' + Object.values(types_1.RouteStatus).join(', ')
                });
                return;
            }
            const updatedRoute = await this.routeService.updateRouteStatus(id, status);
            if (!updatedRoute) {
                res.status(404).json({ error: `Route not found with ID: ${id}` });
                return;
            }
            res.status(200).json(updatedRoute);
        }
        catch (error) {
            console.error('Error in updateRouteStatus controller:', error);
            res.status(500).json({
                error: 'Failed to update route status',
                message: error instanceof Error ? error.message : String(error)
            });
        }
    }
    async geocodeAddress(req, res) {
        try {
            const { address } = req.body;
            if (!address || !address.street || !address.city || !address.state || !address.zipCode) {
                res.status(400).json({
                    error: 'Invalid address. street, city, state, and zipCode are required.'
                });
                return;
            }
            const location = await this.routeService.geocodeAddress(address);
            res.status(200).json(location);
        }
        catch (error) {
            console.error('Error in geocodeAddress controller:', error);
            res.status(500).json({
                error: 'Failed to geocode address',
                message: error instanceof Error ? error.message : String(error)
            });
        }
    }
    async calculateDistance(req, res) {
        try {
            const { origin, destination } = req.body;
            if (!origin || !destination || !origin.latitude || !origin.longitude ||
                !destination.latitude || !destination.longitude) {
                res.status(400).json({
                    error: 'Invalid request. origin and destination with latitude and longitude are required.'
                });
                return;
            }
            const result = await this.routeService.calculateDistance(origin, destination);
            res.status(200).json(result);
        }
        catch (error) {
            console.error('Error in calculateDistance controller:', error);
            res.status(500).json({
                error: 'Failed to calculate distance',
                message: error instanceof Error ? error.message : String(error)
            });
        }
    }
    async generateDirections(req, res) {
        try {
            const { id } = req.params;
            const directions = await this.routeService.generateTurnByTurnDirections(id);
            res.status(200).json(directions);
        }
        catch (error) {
            console.error('Error in generateDirections controller:', error);
            res.status(500).json({
                error: 'Failed to generate directions',
                message: error instanceof Error ? error.message : String(error)
            });
        }
    }
    async calculateTravelTimes(req, res) {
        try {
            const { id } = req.params;
            const { startTime } = req.body;
            let parsedStartTime;
            if (startTime) {
                parsedStartTime = new Date(startTime);
                if (isNaN(parsedStartTime.getTime())) {
                    res.status(400).json({ error: 'Invalid startTime format. Use ISO date string.' });
                    return;
                }
            }
            const updatedRoute = await this.routeService.calculateEstimatedTravelTimes(id, parsedStartTime);
            if (!updatedRoute) {
                res.status(404).json({ error: `Route not found with ID: ${id}` });
                return;
            }
            res.status(200).json(updatedRoute);
        }
        catch (error) {
            console.error('Error in calculateTravelTimes controller:', error);
            res.status(500).json({
                error: 'Failed to calculate travel times',
                message: error instanceof Error ? error.message : String(error)
            });
        }
    }
    async getRouteMapData(req, res) {
        try {
            const { id } = req.params;
            const route = await this.routeService.getRouteById(id);
            if (!route) {
                res.status(404).json({ error: `Route not found with ID: ${id}` });
                return;
            }
            const mapData = await this.routeService.generateRouteMapData(id);
            res.status(200).json(mapData);
        }
        catch (error) {
            console.error('Error in getRouteMapData controller:', error);
            res.status(500).json({
                error: 'Failed to get route map data',
                message: error instanceof Error ? error.message : String(error)
            });
        }
    }
    async reorderRouteStops(req, res) {
        try {
            const { id } = req.params;
            const { stopOrder } = req.body;
            if (!stopOrder || !Array.isArray(stopOrder)) {
                res.status(400).json({ error: 'Invalid request. stopOrder array is required.' });
                return;
            }
            const updatedRoute = await this.routeService.reorderRouteStops(id, stopOrder);
            if (!updatedRoute) {
                res.status(404).json({ error: `Route not found with ID: ${id}` });
                return;
            }
            res.status(200).json(updatedRoute);
        }
        catch (error) {
            console.error('Error in reorderRouteStops controller:', error);
            res.status(500).json({
                error: 'Failed to reorder route stops',
                message: error instanceof Error ? error.message : String(error)
            });
        }
    }
    async getTimeWindowConflicts(req, res) {
        try {
            const { id } = req.params;
            const { orders } = req.body;
            if (!orders || !Array.isArray(orders)) {
                res.status(400).json({ error: 'Invalid request. orders array is required.' });
                return;
            }
            const conflicts = await this.routeService.validateTimeWindows(id, orders);
            if (conflicts === null) {
                res.status(404).json({ error: `Route not found with ID: ${id}` });
                return;
            }
            res.status(200).json({ conflicts });
        }
        catch (error) {
            console.error('Error in getTimeWindowConflicts controller:', error);
            res.status(500).json({
                error: 'Failed to get time window conflicts',
                message: error instanceof Error ? error.message : String(error)
            });
        }
    }
}
exports.RouteController = RouteController;
exports.default = RouteController;
//# sourceMappingURL=RouteController.js.map
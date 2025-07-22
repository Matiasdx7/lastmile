"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRouteRouter = void 0;
const express_1 = require("express");
const RouteController_1 = __importDefault(require("../controllers/RouteController"));
const createRouteRouter = (pool) => {
    const router = (0, express_1.Router)();
    const routeController = new RouteController_1.default(pool);
    router.post('/', (req, res) => routeController.createRoute(req, res));
    router.get('/', (req, res) => routeController.getRoutes(req, res));
    router.get('/:id', (req, res) => routeController.getRoute(req, res));
    router.put('/:id/stops', (req, res) => routeController.updateRouteStops(req, res));
    router.put('/:id/status', (req, res) => routeController.updateRouteStatus(req, res));
    router.post('/geocode', (req, res) => routeController.geocodeAddress(req, res));
    router.post('/distance', (req, res) => routeController.calculateDistance(req, res));
    router.get('/:id/directions', (req, res) => routeController.generateDirections(req, res));
    router.post('/:id/travel-times', (req, res) => routeController.calculateTravelTimes(req, res));
    router.get('/:id/map-data', (req, res) => routeController.getRouteMapData(req, res));
    router.put('/:id/reorder', (req, res) => routeController.reorderRouteStops(req, res));
    router.post('/:id/time-window-conflicts', (req, res) => routeController.getTimeWindowConflicts(req, res));
    return router;
};
exports.createRouteRouter = createRouteRouter;
exports.default = exports.createRouteRouter;
//# sourceMappingURL=routeRoutes.js.map
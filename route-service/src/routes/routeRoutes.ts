import { Router } from 'express';
import { Pool } from 'pg';
import RouteController from '../controllers/RouteController';

export const createRouteRouter = (pool: Pool): Router => {
  const router = Router();
  const routeController = new RouteController(pool);

  // Route management endpoints
  router.post('/', (req, res) => routeController.createRoute(req, res));
  router.get('/', (req, res) => routeController.getRoutes(req, res));
  router.get('/:id', (req, res) => routeController.getRoute(req, res));
  router.put('/:id/stops', (req, res) => routeController.updateRouteStops(req, res));
  router.put('/:id/status', (req, res) => routeController.updateRouteStatus(req, res));

  // Maps API integration endpoints
  router.post('/geocode', (req, res) => routeController.geocodeAddress(req, res));
  router.post('/distance', (req, res) => routeController.calculateDistance(req, res));
  router.get('/:id/directions', (req, res) => routeController.generateDirections(req, res));
  router.post('/:id/travel-times', (req, res) => routeController.calculateTravelTimes(req, res));
  
  // Manual route planning interface endpoints
  router.get('/:id/map-data', (req, res) => routeController.getRouteMapData(req, res));
  router.put('/:id/reorder', (req, res) => routeController.reorderRouteStops(req, res));
  router.post('/:id/time-window-conflicts', (req, res) => routeController.getTimeWindowConflicts(req, res));

  return router;
};

export default createRouteRouter;
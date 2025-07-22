import { Request, Response } from 'express';
import { Pool } from 'pg';
import RouteService from '../services/RouteService';
import { RouteStatus, RouteStop } from '../../../shared/types';

export class RouteController {
  private routeService: RouteService;

  constructor(pool: Pool) {
    this.routeService = new RouteService(pool);
  }

  /**
   * Create a new route
   * @param req Request with loadId, vehicleId, and stops in the body
   * @param res Response object
   */
  async createRoute(req: Request, res: Response): Promise<void> {
    try {
      const { loadId, vehicleId, stops } = req.body;
      
      if (!loadId || !vehicleId || !stops || !Array.isArray(stops)) {
        res.status(400).json({ error: 'Invalid request. loadId, vehicleId, and stops array are required.' });
        return;
      }
      
      const route = await this.routeService.createRoute(loadId, vehicleId, stops);
      res.status(201).json(route);
    } catch (error) {
      console.error('Error in createRoute controller:', error);
      res.status(500).json({ 
        error: 'Failed to create route',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get a route by ID
   * @param req Request with route ID in params
   * @param res Response object
   */
  async getRoute(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const route = await this.routeService.getRouteById(id);
      
      if (!route) {
        res.status(404).json({ error: `Route not found with ID: ${id}` });
        return;
      }
      
      res.status(200).json(route);
    } catch (error) {
      console.error('Error in getRoute controller:', error);
      res.status(500).json({ 
        error: 'Failed to get route',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get all routes or filter by status
   * @param req Request with optional status query param
   * @param res Response object
   */
  async getRoutes(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.query;
      let routes;
      
      if (status && Object.values(RouteStatus).includes(status as RouteStatus)) {
        routes = await this.routeService.getRoutesByStatus(status as RouteStatus);
      } else {
        routes = await this.routeService.getAllRoutes();
      }
      
      res.status(200).json(routes);
    } catch (error) {
      console.error('Error in getRoutes controller:', error);
      res.status(500).json({ 
        error: 'Failed to get routes',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Update route stops and recalculate metrics
   * @param req Request with route ID in params and stops in body
   * @param res Response object
   */
  async updateRouteStops(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      console.error('Error in updateRouteStops controller:', error);
      res.status(500).json({ 
        error: 'Failed to update route stops',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Update route status
   * @param req Request with route ID in params and status in body
   * @param res Response object
   */
  async updateRouteStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status || !Object.values(RouteStatus).includes(status as RouteStatus)) {
        res.status(400).json({ 
          error: 'Invalid status. Must be one of: ' + Object.values(RouteStatus).join(', ')
        });
        return;
      }
      
      const updatedRoute = await this.routeService.updateRouteStatus(id, status as RouteStatus);
      
      if (!updatedRoute) {
        res.status(404).json({ error: `Route not found with ID: ${id}` });
        return;
      }
      
      res.status(200).json(updatedRoute);
    } catch (error) {
      console.error('Error in updateRouteStatus controller:', error);
      res.status(500).json({ 
        error: 'Failed to update route status',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Geocode an address to get coordinates
   * @param req Request with address in body
   * @param res Response object
   */
  async geocodeAddress(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      console.error('Error in geocodeAddress controller:', error);
      res.status(500).json({ 
        error: 'Failed to geocode address',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Calculate distance and duration between two locations
   * @param req Request with origin and destination in body
   * @param res Response object
   */
  async calculateDistance(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      console.error('Error in calculateDistance controller:', error);
      res.status(500).json({ 
        error: 'Failed to calculate distance',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Generate turn-by-turn directions for a route
   * @param req Request with route ID in params
   * @param res Response object
   */
  async generateDirections(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const directions = await this.routeService.generateTurnByTurnDirections(id);
      res.status(200).json(directions);
    } catch (error) {
      console.error('Error in generateDirections controller:', error);
      res.status(500).json({ 
        error: 'Failed to generate directions',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Calculate estimated travel times for a route
   * @param req Request with route ID in params and optional startTime in body
   * @param res Response object
   */
  async calculateTravelTimes(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { startTime } = req.body;
      
      let parsedStartTime: Date | undefined;
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
    } catch (error) {
      console.error('Error in calculateTravelTimes controller:', error);
      res.status(500).json({ 
        error: 'Failed to calculate travel times',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get route map data for visualization
   * @param req Request with route ID in params
   * @param res Response object
   */
  async getRouteMapData(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const route = await this.routeService.getRouteById(id);
      
      if (!route) {
        res.status(404).json({ error: `Route not found with ID: ${id}` });
        return;
      }
      
      // Get polyline and waypoints for map visualization
      const mapData = await this.routeService.generateRouteMapData(id);
      res.status(200).json(mapData);
    } catch (error) {
      console.error('Error in getRouteMapData controller:', error);
      res.status(500).json({ 
        error: 'Failed to get route map data',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Reorder stops in a route using drag-and-drop sequence
   * @param req Request with route ID in params and new stop order in body
   * @param res Response object
   */
  async reorderRouteStops(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      console.error('Error in reorderRouteStops controller:', error);
      res.status(500).json({ 
        error: 'Failed to reorder route stops',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get time window conflicts for a route
   * @param req Request with route ID in params
   * @param res Response object
   */
  async getTimeWindowConflicts(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      console.error('Error in getTimeWindowConflicts controller:', error);
      res.status(500).json({ 
        error: 'Failed to get time window conflicts',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

export default RouteController;
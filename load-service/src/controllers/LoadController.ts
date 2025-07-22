import { Request, Response } from 'express';
import { LoadConsolidationService } from '../services/LoadConsolidationService';
import { OrderRepository } from '../../../shared/database/repositories/OrderRepository';
import { LoadRepository } from '../../../shared/database/repositories/LoadRepository';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';

export class LoadController {
  private loadConsolidationService: LoadConsolidationService;
  
  constructor(dbPool: Pool) {
    const orderRepository = new OrderRepository(dbPool);
    const loadRepository = new LoadRepository(dbPool);
    this.loadConsolidationService = new LoadConsolidationService(orderRepository, loadRepository);
  }
  
  /**
   * Creates a new load by grouping orders in a geographic area
   * @param req Request with latitude, longitude, and optional grouping options
   * @param res Response with created loads
   */
  async createLoadsByGeographicArea(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const schema = Joi.object({
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
        maxDistanceKm: Joi.number().min(0),
        maxWeightKg: Joi.number().min(0),
        maxVolumeM3: Joi.number().min(0),
        maxTimeWindowOverlapMinutes: Joi.number().min(0)
      });
      
      const { error, value } = schema.validate(req.body);
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }
      
      const { latitude, longitude, ...options } = value;
      
      // Group orders and create loads
      const loads = await this.loadConsolidationService.groupOrdersByGeographicArea(
        latitude,
        longitude,
        options
      );
      
      res.status(201).json({
        message: `Created ${loads.length} load(s)`,
        loads
      });
    } catch (error) {
      console.error('Error creating loads:', error);
      res.status(500).json({ error: 'Failed to create loads' });
    }
  }
  
  /**
   * Gets all loads with optional status filter
   * @param req Request with optional status query parameter
   * @param res Response with loads
   */
  async getLoads(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.query;
      
      const loadRepository = new LoadRepository(req.app.locals.dbPool);
      let loads;
      
      if (status) {
        // Validate status
        const validStatuses = ['pending', 'consolidated', 'assigned', 'dispatched', 'completed'];
        if (!validStatuses.includes(status as string)) {
          res.status(400).json({ error: 'Invalid status' });
          return;
        }
        
        loads = await loadRepository.findByStatus(status as any);
      } else {
        loads = await loadRepository.findAll();
      }
      
      res.status(200).json({ loads });
    } catch (error) {
      console.error('Error getting loads:', error);
      res.status(500).json({ error: 'Failed to get loads' });
    }
  }
  
  /**
   * Gets a specific load by ID
   * @param req Request with load ID
   * @param res Response with load details
   */
  async getLoadById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const loadRepository = new LoadRepository(req.app.locals.dbPool);
      const load = await loadRepository.findById(id);
      
      if (!load) {
        res.status(404).json({ error: 'Load not found' });
        return;
      }
      
      res.status(200).json({ load });
    } catch (error) {
      console.error('Error getting load:', error);
      res.status(500).json({ error: 'Failed to get load' });
    }
  }
  
  /**
   * Adds an order to an existing load
   * @param req Request with load ID and order ID
   * @param res Response with updated load
   */
  async addOrderToLoad(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate request body
      const schema = Joi.object({
        orderId: Joi.string().required()
      });
      
      const { error, value } = schema.validate(req.body);
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }
      
      const { orderId } = value;
      
      // Add order to load
      const updatedLoad = await this.loadConsolidationService.addOrderToLoad(id, orderId);
      
      if (!updatedLoad) {
        res.status(400).json({
          error: 'Failed to add order to load. Check if load exists, order exists, or if capacity constraints are violated.'
        });
        return;
      }
      
      res.status(200).json({
        message: 'Order added to load successfully',
        load: updatedLoad
      });
    } catch (error) {
      console.error('Error adding order to load:', error);
      res.status(500).json({ error: 'Failed to add order to load' });
    }
  }
  
  /**
   * Removes an order from a load
   * @param req Request with load ID and order ID
   * @param res Response with updated load
   */
  async removeOrderFromLoad(req: Request, res: Response): Promise<void> {
    try {
      const { id, orderId } = req.params;
      
      // Remove order from load
      const updatedLoad = await this.loadConsolidationService.removeOrderFromLoad(id, orderId);
      
      if (!updatedLoad) {
        res.status(400).json({
          error: 'Failed to remove order from load. Check if load exists and contains the specified order.'
        });
        return;
      }
      
      res.status(200).json({
        message: 'Order removed from load successfully',
        load: updatedLoad
      });
    } catch (error) {
      console.error('Error removing order from load:', error);
      res.status(500).json({ error: 'Failed to remove order from load' });
    }
  }
  
  /**
   * Updates a load's status
   * @param req Request with load ID and new status
   * @param res Response with updated load
   */
  async updateLoadStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate request body
      const schema = Joi.object({
        status: Joi.string().valid('pending', 'consolidated', 'assigned', 'dispatched', 'completed').required()
      });
      
      const { error, value } = schema.validate(req.body);
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }
      
      const { status } = value;
      
      const loadRepository = new LoadRepository(req.app.locals.dbPool);
      const updatedLoad = await loadRepository.updateStatus(id, status as any);
      
      if (!updatedLoad) {
        res.status(404).json({ error: 'Load not found' });
        return;
      }
      
      res.status(200).json({
        message: 'Load status updated successfully',
        load: updatedLoad
      });
    } catch (error) {
      console.error('Error updating load status:', error);
      res.status(500).json({ error: 'Failed to update load status' });
    }
  }
  
  /**
   * Detects conflicts in delivery requirements for a load
   * @param req Request with load ID
   * @param res Response with conflicts
   */
  async detectDeliveryConflicts(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const conflicts = await this.loadConsolidationService.detectDeliveryConflicts(id);
      
      res.status(200).json({
        loadId: id,
        conflicts,
        hasConflicts: conflicts.length > 0
      });
    } catch (error) {
      console.error('Error detecting delivery conflicts:', error);
      res.status(500).json({ error: 'Failed to detect delivery conflicts' });
    }
  }
  
  /**
   * Checks if an order can be added to a load
   * @param req Request with load ID and order ID
   * @param res Response with compatibility result
   */
  async checkOrderCompatibility(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Validate request body
      const schema = Joi.object({
        orderId: Joi.string().required()
      });
      
      const { error, value } = schema.validate(req.body);
      if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
      }
      
      const { orderId } = value;
      
      const loadRepository = new LoadRepository(req.app.locals.dbPool);
      const orderRepository = new OrderRepository(req.app.locals.dbPool);
      
      const load = await loadRepository.findById(id);
      const order = await orderRepository.findById(orderId);
      
      if (!load || !order) {
        res.status(404).json({
          error: !load ? 'Load not found' : 'Order not found'
        });
        return;
      }
      
      const isCompatible = await this.loadConsolidationService.canAddOrderToLoad(load, order);
      
      res.status(200).json({
        loadId: id,
        orderId,
        isCompatible,
        message: isCompatible
          ? 'Order is compatible with load'
          : 'Order is not compatible with load due to capacity or time window constraints'
      });
    } catch (error) {
      console.error('Error checking order compatibility:', error);
      res.status(500).json({ error: 'Failed to check order compatibility' });
    }
  }
}
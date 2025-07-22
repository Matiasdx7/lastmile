import express from 'express';
import { LoadController } from '../controllers/LoadController';

export const loadRoutes = (dbPool: any) => {
  const router = express.Router();
  const loadController = new LoadController(dbPool);
  
  /**
   * @route POST /api/loads/group
   * @desc Create loads by grouping orders in a geographic area
   * @access Private
   */
  router.post('/group', (req, res) => loadController.createLoadsByGeographicArea(req, res));
  
  /**
   * @route GET /api/loads
   * @desc Get all loads with optional status filter
   * @access Private
   */
  router.get('/', (req, res) => loadController.getLoads(req, res));
  
  /**
   * @route GET /api/loads/:id
   * @desc Get a specific load by ID
   * @access Private
   */
  router.get('/:id', (req, res) => loadController.getLoadById(req, res));
  
  /**
   * @route POST /api/loads/:id/orders
   * @desc Add an order to a load
   * @access Private
   */
  router.post('/:id/orders', (req, res) => loadController.addOrderToLoad(req, res));
  
  /**
   * @route DELETE /api/loads/:id/orders/:orderId
   * @desc Remove an order from a load
   * @access Private
   */
  router.delete('/:id/orders/:orderId', (req, res) => loadController.removeOrderFromLoad(req, res));
  
  /**
   * @route PUT /api/loads/:id/status
   * @desc Update a load's status
   * @access Private
   */
  router.put('/:id/status', (req, res) => loadController.updateLoadStatus(req, res));
  
  /**
   * @route GET /api/loads/:id/conflicts
   * @desc Detect conflicts in delivery requirements for a load
   * @access Private
   */
  router.get('/:id/conflicts', (req, res) => loadController.detectDeliveryConflicts(req, res));
  
  /**
   * @route POST /api/loads/:id/check-compatibility
   * @desc Check if an order can be added to a load
   * @access Private
   */
  router.post('/:id/check-compatibility', (req, res) => loadController.checkOrderCompatibility(req, res));
  
  return router;
};
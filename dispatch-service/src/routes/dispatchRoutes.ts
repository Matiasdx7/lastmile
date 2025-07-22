import { Router } from 'express';
import { DispatchController } from '../controllers/DispatchController';

export const createDispatchRoutes = (dispatchController: DispatchController): Router => {
  const router = Router();

  // Create a new dispatch
  router.post('/', dispatchController.createDispatch.bind(dispatchController));

  // Get all dispatches
  router.get('/', dispatchController.getAllDispatches.bind(dispatchController));

  // Get active dispatches
  router.get('/active', dispatchController.getActiveDispatches.bind(dispatchController));

  // Get dispatch by ID
  router.get('/:id', dispatchController.getDispatch.bind(dispatchController));

  // Confirm dispatch and update orders to "in transit"
  router.post('/:id/confirm', dispatchController.confirmDispatch.bind(dispatchController));

  // Get route summary for a dispatch
  router.get('/:id/route-summary', dispatchController.getRouteSummary.bind(dispatchController));
  
  // Get detailed route summary with vehicle, driver, and order information
  router.get('/:id/detailed-summary', dispatchController.getDetailedRouteSummary.bind(dispatchController));

  // Send route information to driver's mobile device
  router.post('/:id/send-to-driver', dispatchController.sendRouteToDriver.bind(dispatchController));
  
  // Confirm dispatch and send route to driver in a single operation
  router.post('/:id/confirm-and-send', dispatchController.confirmDispatchAndSendRoute.bind(dispatchController));

  // Update dispatch status
  router.put('/:id/status', dispatchController.updateDispatchStatus.bind(dispatchController));

  return router;
};
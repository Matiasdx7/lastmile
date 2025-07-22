import { Router } from 'express';
import { VehicleAssignmentController } from '../controllers/VehicleAssignmentController';

export const createVehicleAssignmentRouter = (vehicleAssignmentController: VehicleAssignmentController): Router => {
  const router = Router();

  // Assign a vehicle to a load
  router.post('/loads/:loadId/assign', vehicleAssignmentController.assignVehicleToLoad);

  // Unassign a vehicle from a load
  router.post('/loads/:loadId/unassign', vehicleAssignmentController.unassignVehicleFromLoad);

  // Get all loads assigned to a vehicle
  router.get('/vehicles/:vehicleId/loads', vehicleAssignmentController.getLoadsForVehicle);

  // Batch assign vehicles to all unassigned loads
  router.post('/batch-assign', vehicleAssignmentController.batchAssignVehicles);

  // Check if a vehicle has sufficient capacity for a load
  router.get('/vehicles/:vehicleId/capacity-check/:loadId', vehicleAssignmentController.checkVehicleCapacityForLoad);

  return router;
};
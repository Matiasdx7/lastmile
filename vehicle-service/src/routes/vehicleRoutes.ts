import { Router } from 'express';
import { VehicleController } from '../controllers/VehicleController';

export const createVehicleRouter = (vehicleController: VehicleController): Router => {
  const router = Router();

  // Get all vehicles with optional filtering
  router.get('/', vehicleController.getAllVehicles);

  // Get vehicle by ID
  router.get('/:id', vehicleController.getVehicleById);

  // Create a new vehicle
  router.post('/', vehicleController.createVehicle);

  // Update an existing vehicle
  router.put('/:id', vehicleController.updateVehicle);

  // Delete a vehicle
  router.delete('/:id', vehicleController.deleteVehicle);

  // Update vehicle status
  router.put('/:id/status', vehicleController.updateVehicleStatus);

  // Update vehicle location
  router.put('/:id/location', vehicleController.updateVehicleLocation);

  // Get vehicle capacity
  router.get('/:id/capacity', vehicleController.getVehicleCapacity);

  // Find available vehicles in an area
  router.get('/available/area', vehicleController.findAvailableVehiclesInArea);

  return router;
};
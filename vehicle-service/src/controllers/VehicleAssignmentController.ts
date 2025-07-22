import { Request, Response } from 'express';
import { VehicleAssignmentService, AssignmentCriteria } from '../services/VehicleAssignmentService';
import { VehicleType } from '../../../shared/types/enums/VehicleType';

export class VehicleAssignmentController {
  private vehicleAssignmentService: VehicleAssignmentService;

  constructor(vehicleAssignmentService: VehicleAssignmentService) {
    this.vehicleAssignmentService = vehicleAssignmentService;
  }

  /**
   * Assign a vehicle to a load
   */
  assignVehicleToLoad = async (req: Request, res: Response): Promise<void> => {
    try {
      const { loadId } = req.params;
      const criteria: AssignmentCriteria = req.body.criteria || {};
      
      // Validate criteria
      if (criteria.preferredVehicleType && !Object.values(VehicleType).includes(criteria.preferredVehicleType as VehicleType)) {
        res.status(400).json({ 
          error: {
            code: 'INVALID_VEHICLE_TYPE',
            message: `Invalid vehicle type: ${criteria.preferredVehicleType}. Valid types are: ${Object.values(VehicleType).join(', ')}`,
            timestamp: new Date().toISOString()
          }
        });
        return;
      }
      
      const vehicle = await this.vehicleAssignmentService.assignVehicleToLoad(loadId, criteria);
      
      if (!vehicle) {
        res.status(404).json({ 
          error: {
            code: 'NO_SUITABLE_VEHICLE',
            message: `No suitable vehicle found for load ${loadId}`,
            timestamp: new Date().toISOString()
          }
        });
        return;
      }
      
      res.status(200).json({ 
        message: `Vehicle ${vehicle.id} assigned to load ${loadId}`,
        assignment: {
          loadId,
          vehicleId: vehicle.id,
          vehicleType: vehicle.type,
          licensePlate: vehicle.licensePlate
        }
      });
    } catch (error) {
      console.error('Error assigning vehicle to load:', error);
      
      if ((error as Error).message.includes('already assigned')) {
        res.status(409).json({ 
          error: {
            code: 'LOAD_ALREADY_ASSIGNED',
            message: (error as Error).message,
            timestamp: new Date().toISOString()
          }
        });
        return;
      }
      
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({ 
          error: {
            code: 'LOAD_NOT_FOUND',
            message: (error as Error).message,
            timestamp: new Date().toISOString()
          }
        });
        return;
      }
      
      if ((error as Error).message.includes('not in CONSOLIDATED status')) {
        res.status(400).json({ 
          error: {
            code: 'INVALID_LOAD_STATUS',
            message: (error as Error).message,
            timestamp: new Date().toISOString()
          }
        });
        return;
      }
      
      res.status(500).json({ 
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while assigning vehicle to load',
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  /**
   * Unassign a vehicle from a load
   */
  unassignVehicleFromLoad = async (req: Request, res: Response): Promise<void> => {
    try {
      const { loadId } = req.params;
      
      const success = await this.vehicleAssignmentService.unassignVehicleFromLoad(loadId);
      
      if (success) {
        res.status(200).json({ 
          message: `Vehicle unassigned from load ${loadId}`,
          loadId
        });
      } else {
        res.status(500).json({ 
          error: {
            code: 'UNASSIGNMENT_FAILED',
            message: `Failed to unassign vehicle from load ${loadId}`,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Error unassigning vehicle from load:', error);
      
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({ 
          error: {
            code: 'LOAD_NOT_FOUND',
            message: (error as Error).message,
            timestamp: new Date().toISOString()
          }
        });
        return;
      }
      
      if ((error as Error).message.includes('not assigned')) {
        res.status(400).json({ 
          error: {
            code: 'LOAD_NOT_ASSIGNED',
            message: (error as Error).message,
            timestamp: new Date().toISOString()
          }
        });
        return;
      }
      
      res.status(500).json({ 
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while unassigning vehicle from load',
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  /**
   * Get all loads assigned to a vehicle
   */
  getLoadsForVehicle = async (req: Request, res: Response): Promise<void> => {
    try {
      const { vehicleId } = req.params;
      
      const loads = await this.vehicleAssignmentService.getLoadsForVehicle(vehicleId);
      
      res.status(200).json({ loads });
    } catch (error) {
      console.error('Error getting loads for vehicle:', error);
      res.status(500).json({ 
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while retrieving loads for vehicle',
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  /**
   * Batch assign vehicles to all unassigned loads
   */
  batchAssignVehicles = async (req: Request, res: Response): Promise<void> => {
    try {
      const criteria: AssignmentCriteria = req.body.criteria || {};
      
      // Validate criteria
      if (criteria.preferredVehicleType && !Object.values(VehicleType).includes(criteria.preferredVehicleType as VehicleType)) {
        res.status(400).json({ 
          error: {
            code: 'INVALID_VEHICLE_TYPE',
            message: `Invalid vehicle type: ${criteria.preferredVehicleType}. Valid types are: ${Object.values(VehicleType).join(', ')}`,
            timestamp: new Date().toISOString()
          }
        });
        return;
      }
      
      const result = await this.vehicleAssignmentService.batchAssignVehiclesToLoads(criteria);
      
      res.status(200).json({ 
        message: `Assigned ${result.successful.length} loads, failed to assign ${result.failed.length} loads`,
        result
      });
    } catch (error) {
      console.error('Error batch assigning vehicles:', error);
      res.status(500).json({ 
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred during batch vehicle assignment',
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  /**
   * Check if a vehicle has sufficient capacity for a load
   */
  checkVehicleCapacityForLoad = async (req: Request, res: Response): Promise<void> => {
    try {
      const { vehicleId, loadId } = req.params;
      
      const hasCapacity = await this.vehicleAssignmentService.checkVehicleCapacityForLoad(vehicleId, loadId);
      
      res.status(200).json({ 
        vehicleId,
        loadId,
        hasCapacity
      });
    } catch (error) {
      console.error('Error checking vehicle capacity for load:', error);
      res.status(500).json({ 
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while checking vehicle capacity',
          timestamp: new Date().toISOString()
        }
      });
    }
  };
}
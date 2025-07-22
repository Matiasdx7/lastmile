import Joi from 'joi';
import { Vehicle, VehicleStatus, VehicleType } from '../../../shared/types';

export class VehicleValidator {
  private vehicleSchema = Joi.object({
    licensePlate: Joi.string().required().min(2).max(20),
    type: Joi.string().valid(...Object.values(VehicleType)).required(),
    capacity: Joi.object({
      maxWeight: Joi.number().required().min(0),
      maxVolume: Joi.number().required().min(0),
      maxPackages: Joi.number().required().min(0).integer()
    }).required(),
    currentLocation: Joi.object({
      latitude: Joi.number().required().min(-90).max(90),
      longitude: Joi.number().required().min(-180).max(180)
    }).optional(),
    status: Joi.string().valid(...Object.values(VehicleStatus)).default(VehicleStatus.AVAILABLE),
    driverId: Joi.string().optional()
  });

  private vehicleUpdateSchema = Joi.object({
    licensePlate: Joi.string().min(2).max(20).optional(),
    type: Joi.string().valid(...Object.values(VehicleType)).optional(),
    capacity: Joi.object({
      maxWeight: Joi.number().min(0).required(),
      maxVolume: Joi.number().min(0).required(),
      maxPackages: Joi.number().min(0).integer().required()
    }).optional(),
    currentLocation: Joi.object({
      latitude: Joi.number().required().min(-90).max(90),
      longitude: Joi.number().required().min(-180).max(180)
    }).optional(),
    status: Joi.string().valid(...Object.values(VehicleStatus)).optional(),
    driverId: Joi.string().optional().allow(null)
  });

  validateVehicle(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.vehicleSchema.validate(vehicle);
  }

  validateVehicleUpdates(updates: Partial<Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>>) {
    return this.vehicleUpdateSchema.validate(updates);
  }
}
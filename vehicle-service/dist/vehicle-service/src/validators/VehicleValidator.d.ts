import Joi from 'joi';
import { Vehicle } from '../../../shared/types';
export declare class VehicleValidator {
    private vehicleSchema;
    private vehicleUpdateSchema;
    validateVehicle(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Joi.ValidationResult<any>;
    validateVehicleUpdates(updates: Partial<Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>>): Joi.ValidationResult<any>;
}
//# sourceMappingURL=VehicleValidator.d.ts.map
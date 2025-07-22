"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleValidator = void 0;
const joi_1 = __importDefault(require("joi"));
const types_1 = require("../../../shared/types");
class VehicleValidator {
    constructor() {
        this.vehicleSchema = joi_1.default.object({
            licensePlate: joi_1.default.string().required().min(2).max(20),
            type: joi_1.default.string().valid(...Object.values(types_1.VehicleType)).required(),
            capacity: joi_1.default.object({
                maxWeight: joi_1.default.number().required().min(0),
                maxVolume: joi_1.default.number().required().min(0),
                maxPackages: joi_1.default.number().required().min(0).integer()
            }).required(),
            currentLocation: joi_1.default.object({
                latitude: joi_1.default.number().required().min(-90).max(90),
                longitude: joi_1.default.number().required().min(-180).max(180)
            }).optional(),
            status: joi_1.default.string().valid(...Object.values(types_1.VehicleStatus)).default(types_1.VehicleStatus.AVAILABLE),
            driverId: joi_1.default.string().optional()
        });
        this.vehicleUpdateSchema = joi_1.default.object({
            licensePlate: joi_1.default.string().min(2).max(20).optional(),
            type: joi_1.default.string().valid(...Object.values(types_1.VehicleType)).optional(),
            capacity: joi_1.default.object({
                maxWeight: joi_1.default.number().min(0).required(),
                maxVolume: joi_1.default.number().min(0).required(),
                maxPackages: joi_1.default.number().min(0).integer().required()
            }).optional(),
            currentLocation: joi_1.default.object({
                latitude: joi_1.default.number().required().min(-90).max(90),
                longitude: joi_1.default.number().required().min(-180).max(180)
            }).optional(),
            status: joi_1.default.string().valid(...Object.values(types_1.VehicleStatus)).optional(),
            driverId: joi_1.default.string().optional().allow(null)
        });
    }
    validateVehicle(vehicle) {
        return this.vehicleSchema.validate(vehicle);
    }
    validateVehicleUpdates(updates) {
        return this.vehicleUpdateSchema.validate(updates);
    }
}
exports.VehicleValidator = VehicleValidator;
//# sourceMappingURL=VehicleValidator.js.map
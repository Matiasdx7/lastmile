"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleAssignmentController = void 0;
const VehicleType_1 = require("../../../shared/types/enums/VehicleType");
class VehicleAssignmentController {
    constructor(vehicleAssignmentService) {
        this.assignVehicleToLoad = async (req, res) => {
            try {
                const { loadId } = req.params;
                const criteria = req.body.criteria || {};
                if (criteria.preferredVehicleType && !Object.values(VehicleType_1.VehicleType).includes(criteria.preferredVehicleType)) {
                    res.status(400).json({
                        error: {
                            code: 'INVALID_VEHICLE_TYPE',
                            message: `Invalid vehicle type: ${criteria.preferredVehicleType}. Valid types are: ${Object.values(VehicleType_1.VehicleType).join(', ')}`,
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
            }
            catch (error) {
                console.error('Error assigning vehicle to load:', error);
                if (error.message.includes('already assigned')) {
                    res.status(409).json({
                        error: {
                            code: 'LOAD_ALREADY_ASSIGNED',
                            message: error.message,
                            timestamp: new Date().toISOString()
                        }
                    });
                    return;
                }
                if (error.message.includes('not found')) {
                    res.status(404).json({
                        error: {
                            code: 'LOAD_NOT_FOUND',
                            message: error.message,
                            timestamp: new Date().toISOString()
                        }
                    });
                    return;
                }
                if (error.message.includes('not in CONSOLIDATED status')) {
                    res.status(400).json({
                        error: {
                            code: 'INVALID_LOAD_STATUS',
                            message: error.message,
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
        this.unassignVehicleFromLoad = async (req, res) => {
            try {
                const { loadId } = req.params;
                const success = await this.vehicleAssignmentService.unassignVehicleFromLoad(loadId);
                if (success) {
                    res.status(200).json({
                        message: `Vehicle unassigned from load ${loadId}`,
                        loadId
                    });
                }
                else {
                    res.status(500).json({
                        error: {
                            code: 'UNASSIGNMENT_FAILED',
                            message: `Failed to unassign vehicle from load ${loadId}`,
                            timestamp: new Date().toISOString()
                        }
                    });
                }
            }
            catch (error) {
                console.error('Error unassigning vehicle from load:', error);
                if (error.message.includes('not found')) {
                    res.status(404).json({
                        error: {
                            code: 'LOAD_NOT_FOUND',
                            message: error.message,
                            timestamp: new Date().toISOString()
                        }
                    });
                    return;
                }
                if (error.message.includes('not assigned')) {
                    res.status(400).json({
                        error: {
                            code: 'LOAD_NOT_ASSIGNED',
                            message: error.message,
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
        this.getLoadsForVehicle = async (req, res) => {
            try {
                const { vehicleId } = req.params;
                const loads = await this.vehicleAssignmentService.getLoadsForVehicle(vehicleId);
                res.status(200).json({ loads });
            }
            catch (error) {
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
        this.batchAssignVehicles = async (req, res) => {
            try {
                const criteria = req.body.criteria || {};
                if (criteria.preferredVehicleType && !Object.values(VehicleType_1.VehicleType).includes(criteria.preferredVehicleType)) {
                    res.status(400).json({
                        error: {
                            code: 'INVALID_VEHICLE_TYPE',
                            message: `Invalid vehicle type: ${criteria.preferredVehicleType}. Valid types are: ${Object.values(VehicleType_1.VehicleType).join(', ')}`,
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
            }
            catch (error) {
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
        this.checkVehicleCapacityForLoad = async (req, res) => {
            try {
                const { vehicleId, loadId } = req.params;
                const hasCapacity = await this.vehicleAssignmentService.checkVehicleCapacityForLoad(vehicleId, loadId);
                res.status(200).json({
                    vehicleId,
                    loadId,
                    hasCapacity
                });
            }
            catch (error) {
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
        this.vehicleAssignmentService = vehicleAssignmentService;
    }
}
exports.VehicleAssignmentController = VehicleAssignmentController;
//# sourceMappingURL=VehicleAssignmentController.js.map
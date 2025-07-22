"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleController = void 0;
const VehicleStatus_1 = require("../../../shared/types/enums/VehicleStatus");
class VehicleController {
    constructor(vehicleService) {
        this.getAllVehicles = async (req, res) => {
            try {
                const { status, type, limit, offset } = req.query;
                let vehicles;
                if (status) {
                    vehicles = await this.vehicleService.findByStatus(status);
                }
                else if (type) {
                    vehicles = await this.vehicleService.findByType(type);
                }
                else {
                    vehicles = await this.vehicleService.findAll(limit ? parseInt(limit) : undefined, offset ? parseInt(offset) : undefined);
                }
                res.status(200).json({ vehicles });
            }
            catch (error) {
                console.error('Error getting vehicles:', error);
                res.status(500).json({
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'An error occurred while retrieving vehicles',
                        timestamp: new Date().toISOString()
                    }
                });
            }
        };
        this.getVehicleById = async (req, res) => {
            try {
                const { id } = req.params;
                const vehicle = await this.vehicleService.findById(id);
                if (!vehicle) {
                    res.status(404).json({
                        error: {
                            code: 'VEHICLE_NOT_FOUND',
                            message: `Vehicle with ID ${id} not found`,
                            timestamp: new Date().toISOString()
                        }
                    });
                    return;
                }
                res.status(200).json({ vehicle });
            }
            catch (error) {
                console.error('Error getting vehicle by ID:', error);
                res.status(500).json({
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'An error occurred while retrieving the vehicle',
                        timestamp: new Date().toISOString()
                    }
                });
            }
        };
        this.createVehicle = async (req, res) => {
            try {
                const vehicleData = req.body;
                const existingVehicle = await this.vehicleService.findByLicensePlate(vehicleData.licensePlate);
                if (existingVehicle) {
                    res.status(409).json({
                        error: {
                            code: 'LICENSE_PLATE_EXISTS',
                            message: `Vehicle with license plate ${vehicleData.licensePlate} already exists`,
                            timestamp: new Date().toISOString()
                        }
                    });
                    return;
                }
                const newVehicle = await this.vehicleService.create(vehicleData);
                res.status(201).json({ vehicle: newVehicle });
            }
            catch (error) {
                console.error('Error creating vehicle:', error);
                if (error.message.includes('validation')) {
                    res.status(400).json({
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: error.message,
                            timestamp: new Date().toISOString()
                        }
                    });
                    return;
                }
                res.status(500).json({
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'An error occurred while creating the vehicle',
                        timestamp: new Date().toISOString()
                    }
                });
            }
        };
        this.updateVehicle = async (req, res) => {
            try {
                const { id } = req.params;
                const updates = req.body;
                const existingVehicle = await this.vehicleService.findById(id);
                if (!existingVehicle) {
                    res.status(404).json({
                        error: {
                            code: 'VEHICLE_NOT_FOUND',
                            message: `Vehicle with ID ${id} not found`,
                            timestamp: new Date().toISOString()
                        }
                    });
                    return;
                }
                if (updates.licensePlate && updates.licensePlate !== existingVehicle.licensePlate) {
                    const vehicleWithLicensePlate = await this.vehicleService.findByLicensePlate(updates.licensePlate);
                    if (vehicleWithLicensePlate) {
                        res.status(409).json({
                            error: {
                                code: 'LICENSE_PLATE_EXISTS',
                                message: `Vehicle with license plate ${updates.licensePlate} already exists`,
                                timestamp: new Date().toISOString()
                            }
                        });
                        return;
                    }
                }
                const updatedVehicle = await this.vehicleService.update(id, updates);
                res.status(200).json({ vehicle: updatedVehicle });
            }
            catch (error) {
                console.error('Error updating vehicle:', error);
                if (error.message.includes('validation')) {
                    res.status(400).json({
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: error.message,
                            timestamp: new Date().toISOString()
                        }
                    });
                    return;
                }
                res.status(500).json({
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'An error occurred while updating the vehicle',
                        timestamp: new Date().toISOString()
                    }
                });
            }
        };
        this.deleteVehicle = async (req, res) => {
            try {
                const { id } = req.params;
                const existingVehicle = await this.vehicleService.findById(id);
                if (!existingVehicle) {
                    res.status(404).json({
                        error: {
                            code: 'VEHICLE_NOT_FOUND',
                            message: `Vehicle with ID ${id} not found`,
                            timestamp: new Date().toISOString()
                        }
                    });
                    return;
                }
                const deleted = await this.vehicleService.delete(id);
                if (deleted) {
                    res.status(204).send();
                }
                else {
                    res.status(500).json({
                        error: {
                            code: 'DELETE_FAILED',
                            message: 'Failed to delete the vehicle',
                            timestamp: new Date().toISOString()
                        }
                    });
                }
            }
            catch (error) {
                console.error('Error deleting vehicle:', error);
                res.status(500).json({
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'An error occurred while deleting the vehicle',
                        timestamp: new Date().toISOString()
                    }
                });
            }
        };
        this.updateVehicleStatus = async (req, res) => {
            try {
                const { id } = req.params;
                const { status } = req.body;
                if (!Object.values(VehicleStatus_1.VehicleStatus).includes(status)) {
                    res.status(400).json({
                        error: {
                            code: 'INVALID_STATUS',
                            message: `Invalid status: ${status}. Valid statuses are: ${Object.values(VehicleStatus_1.VehicleStatus).join(', ')}`,
                            timestamp: new Date().toISOString()
                        }
                    });
                    return;
                }
                const updatedVehicle = await this.vehicleService.updateStatus(id, status);
                if (!updatedVehicle) {
                    res.status(404).json({
                        error: {
                            code: 'VEHICLE_NOT_FOUND',
                            message: `Vehicle with ID ${id} not found`,
                            timestamp: new Date().toISOString()
                        }
                    });
                    return;
                }
                res.status(200).json({ vehicle: updatedVehicle });
            }
            catch (error) {
                console.error('Error updating vehicle status:', error);
                res.status(500).json({
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'An error occurred while updating the vehicle status',
                        timestamp: new Date().toISOString()
                    }
                });
            }
        };
        this.updateVehicleLocation = async (req, res) => {
            try {
                const { id } = req.params;
                const { latitude, longitude } = req.body;
                if (typeof latitude !== 'number' || typeof longitude !== 'number') {
                    res.status(400).json({
                        error: {
                            code: 'INVALID_LOCATION',
                            message: 'Latitude and longitude must be valid numbers',
                            timestamp: new Date().toISOString()
                        }
                    });
                    return;
                }
                const updatedVehicle = await this.vehicleService.updateLocation(id, latitude, longitude);
                if (!updatedVehicle) {
                    res.status(404).json({
                        error: {
                            code: 'VEHICLE_NOT_FOUND',
                            message: `Vehicle with ID ${id} not found`,
                            timestamp: new Date().toISOString()
                        }
                    });
                    return;
                }
                res.status(200).json({ vehicle: updatedVehicle });
            }
            catch (error) {
                console.error('Error updating vehicle location:', error);
                res.status(500).json({
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'An error occurred while updating the vehicle location',
                        timestamp: new Date().toISOString()
                    }
                });
            }
        };
        this.getVehicleCapacity = async (req, res) => {
            try {
                const { id } = req.params;
                const vehicle = await this.vehicleService.findById(id);
                if (!vehicle) {
                    res.status(404).json({
                        error: {
                            code: 'VEHICLE_NOT_FOUND',
                            message: `Vehicle with ID ${id} not found`,
                            timestamp: new Date().toISOString()
                        }
                    });
                    return;
                }
                res.status(200).json({ capacity: vehicle.capacity });
            }
            catch (error) {
                console.error('Error getting vehicle capacity:', error);
                res.status(500).json({
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'An error occurred while retrieving the vehicle capacity',
                        timestamp: new Date().toISOString()
                    }
                });
            }
        };
        this.findAvailableVehiclesInArea = async (req, res) => {
            try {
                const { latitude, longitude, radiusKm } = req.query;
                if (!latitude || !longitude) {
                    res.status(400).json({
                        error: {
                            code: 'MISSING_COORDINATES',
                            message: 'Latitude and longitude are required',
                            timestamp: new Date().toISOString()
                        }
                    });
                    return;
                }
                const lat = parseFloat(latitude);
                const lng = parseFloat(longitude);
                const radius = radiusKm ? parseFloat(radiusKm) : 50;
                if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
                    res.status(400).json({
                        error: {
                            code: 'INVALID_COORDINATES',
                            message: 'Latitude, longitude, and radius must be valid numbers',
                            timestamp: new Date().toISOString()
                        }
                    });
                    return;
                }
                const vehicles = await this.vehicleService.findAvailableVehiclesInArea(lat, lng, radius);
                res.status(200).json({ vehicles });
            }
            catch (error) {
                console.error('Error finding available vehicles in area:', error);
                res.status(500).json({
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'An error occurred while finding available vehicles',
                        timestamp: new Date().toISOString()
                    }
                });
            }
        };
        this.vehicleService = vehicleService;
    }
}
exports.VehicleController = VehicleController;
//# sourceMappingURL=VehicleController.js.map
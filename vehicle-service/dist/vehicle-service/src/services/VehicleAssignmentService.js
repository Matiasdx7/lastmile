"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleAssignmentService = void 0;
const types_1 = require("../../../shared/types");
class VehicleAssignmentService {
    constructor(vehicleRepository, loadRepository) {
        this.vehicleRepository = vehicleRepository;
        this.loadRepository = loadRepository;
    }
    async assignVehicleToLoad(loadId, criteria = {}) {
        const load = await this.loadRepository.findById(loadId);
        if (!load) {
            throw new Error(`Load with ID ${loadId} not found`);
        }
        if (load.vehicleId) {
            throw new Error(`Load ${loadId} is already assigned to vehicle ${load.vehicleId}`);
        }
        if (load.status !== types_1.LoadStatus.CONSOLIDATED) {
            throw new Error(`Load ${loadId} is not in CONSOLIDATED status and cannot be assigned`);
        }
        const suitableVehicles = await this.findSuitableVehicles(load, criteria);
        if (suitableVehicles.length === 0) {
            return null;
        }
        const bestVehicle = this.selectBestVehicle(suitableVehicles, load, criteria);
        if (!bestVehicle) {
            return null;
        }
        await this.loadRepository.assignVehicle(loadId, bestVehicle.id);
        await this.loadRepository.updateStatus(loadId, types_1.LoadStatus.ASSIGNED);
        await this.vehicleRepository.updateStatus(bestVehicle.id, types_1.VehicleStatus.ASSIGNED);
        return bestVehicle;
    }
    async findSuitableVehicles(load, criteria) {
        const availableVehiclesResult = await this.vehicleRepository.findByStatus(types_1.VehicleStatus.AVAILABLE);
        const availableVehicles = availableVehiclesResult.items;
        const suitableVehicles = availableVehicles.filter((vehicle) => {
            return (vehicle.capacity.maxWeight >= load.totalWeight &&
                vehicle.capacity.maxVolume >= load.totalVolume);
        });
        let filteredVehicles = suitableVehicles;
        if (criteria.preferredVehicleType) {
            const typeMatches = filteredVehicles.filter((v) => v.type === criteria.preferredVehicleType);
            if (typeMatches.length > 0) {
                filteredVehicles = typeMatches;
            }
        }
        if (criteria.prioritizeProximity && criteria.maxDistanceKm && load.orders.length > 0) {
        }
        return filteredVehicles;
    }
    selectBestVehicle(vehicles, load, criteria) {
        if (vehicles.length === 0) {
            return null;
        }
        if (vehicles.length === 1) {
            return vehicles[0];
        }
        const sortedVehicles = [...vehicles].sort((a, b) => {
            const aWeightUtilization = load.totalWeight / a.capacity.maxWeight;
            const bWeightUtilization = load.totalWeight / b.capacity.maxWeight;
            const aVolumeUtilization = load.totalVolume / a.capacity.maxVolume;
            const bVolumeUtilization = load.totalVolume / b.capacity.maxVolume;
            const aAvgUtilization = (aWeightUtilization + aVolumeUtilization) / 2;
            const bAvgUtilization = (bWeightUtilization + bVolumeUtilization) / 2;
            return bAvgUtilization - aAvgUtilization;
        });
        return sortedVehicles[0];
    }
    async unassignVehicleFromLoad(loadId) {
        const load = await this.loadRepository.findById(loadId);
        if (!load) {
            throw new Error(`Load with ID ${loadId} not found`);
        }
        if (!load.vehicleId) {
            throw new Error(`Load ${loadId} is not assigned to any vehicle`);
        }
        const vehicle = await this.vehicleRepository.findById(load.vehicleId);
        await this.loadRepository.update(loadId, {
            vehicleId: undefined,
            status: types_1.LoadStatus.CONSOLIDATED
        });
        if (vehicle) {
            await this.vehicleRepository.updateStatus(vehicle.id, types_1.VehicleStatus.AVAILABLE);
        }
        return true;
    }
    async getLoadsForVehicle(vehicleId) {
        return this.loadRepository.findByVehicleId(vehicleId);
    }
    async batchAssignVehiclesToLoads(criteria = {}) {
        const unassignedLoads = await this.loadRepository.findUnassignedLoads();
        const successful = [];
        const failed = [];
        for (const load of unassignedLoads) {
            try {
                const vehicle = await this.assignVehicleToLoad(load.id, criteria);
                if (vehicle) {
                    successful.push({ loadId: load.id, vehicleId: vehicle.id });
                }
                else {
                    failed.push(load.id);
                }
            }
            catch (error) {
                console.error(`Error assigning vehicle to load ${load.id}:`, error);
                failed.push(load.id);
            }
        }
        return { successful, failed };
    }
    async checkVehicleCapacityForLoad(vehicleId, loadId) {
        const vehicle = await this.vehicleRepository.findById(vehicleId);
        const load = await this.loadRepository.findById(loadId);
        if (!vehicle || !load) {
            return false;
        }
        return (vehicle.capacity.maxWeight >= load.totalWeight &&
            vehicle.capacity.maxVolume >= load.totalVolume);
    }
}
exports.VehicleAssignmentService = VehicleAssignmentService;
//# sourceMappingURL=VehicleAssignmentService.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleService = void 0;
const types_1 = require("../../../shared/types");
const RedisService_1 = __importDefault(require("./RedisService"));
class VehicleService {
    constructor(vehicleRepository, vehicleValidator) {
        this.CACHE_TTL = 300;
        this.VEHICLE_CACHE_PREFIX = 'vehicle:';
        this.AVAILABLE_VEHICLES_CACHE_PREFIX = 'available_vehicles:';
        this.vehicleRepository = vehicleRepository;
        this.vehicleValidator = vehicleValidator;
    }
    async findAll(limit, offset) {
        return this.vehicleRepository.findAll(limit, offset);
    }
    async findById(id) {
        const cacheKey = `${this.VEHICLE_CACHE_PREFIX}${id}`;
        const cachedVehicle = await RedisService_1.default.getJson(cacheKey);
        if (cachedVehicle) {
            return cachedVehicle;
        }
        const vehicle = await this.vehicleRepository.findById(id);
        if (vehicle) {
            await RedisService_1.default.setJson(cacheKey, vehicle, this.CACHE_TTL);
        }
        return vehicle;
    }
    async findByStatus(status, page = 1, pageSize = 20) {
        return this.vehicleRepository.findByStatus(status, page, pageSize);
    }
    async findAllByStatus(status) {
        return this.vehicleRepository.findAllByStatus(status);
    }
    async findByLicensePlate(licensePlate) {
        return this.vehicleRepository.findByLicensePlate(licensePlate);
    }
    async findByDriverId(driverId) {
        return this.vehicleRepository.findByDriverId(driverId);
    }
    async findByType(type) {
        if (!Object.values(types_1.VehicleType).includes(type)) {
            throw new Error(`Invalid vehicle type: ${type}`);
        }
        return this.vehicleRepository.findByType(type);
    }
    async create(vehicleData) {
        const { error } = this.vehicleValidator.validateVehicle(vehicleData);
        if (error) {
            throw new Error(`Vehicle validation error: ${error.message}`);
        }
        if (!vehicleData.status) {
            vehicleData.status = types_1.VehicleStatus.AVAILABLE;
        }
        return this.vehicleRepository.create(vehicleData);
    }
    async update(id, updates) {
        const { error } = this.vehicleValidator.validateVehicleUpdates(updates);
        if (error) {
            throw new Error(`Vehicle validation error: ${error.message}`);
        }
        await RedisService_1.default.del(`${this.VEHICLE_CACHE_PREFIX}${id}`);
        if (updates.status || updates.currentLocation) {
            await RedisService_1.default.invalidatePattern(`${this.AVAILABLE_VEHICLES_CACHE_PREFIX}*`);
        }
        return this.vehicleRepository.update(id, updates);
    }
    async delete(id) {
        return this.vehicleRepository.delete(id);
    }
    async updateStatus(id, status) {
        await RedisService_1.default.del(`${this.VEHICLE_CACHE_PREFIX}${id}`);
        await RedisService_1.default.invalidatePattern(`${this.AVAILABLE_VEHICLES_CACHE_PREFIX}*`);
        return this.vehicleRepository.updateStatus(id, status);
    }
    async updateLocation(id, latitude, longitude) {
        await RedisService_1.default.del(`${this.VEHICLE_CACHE_PREFIX}${id}`);
        await RedisService_1.default.invalidatePattern(`${this.AVAILABLE_VEHICLES_CACHE_PREFIX}*`);
        return this.vehicleRepository.updateLocation(id, latitude, longitude);
    }
    async findAvailableVehiclesInArea(latitude, longitude, radiusKm = 50) {
        const cacheKey = `${this.AVAILABLE_VEHICLES_CACHE_PREFIX}lat:${latitude.toFixed(4)}_lng:${longitude.toFixed(4)}_rad:${radiusKm}`;
        const cachedVehicles = await RedisService_1.default.getJson(cacheKey);
        if (cachedVehicles) {
            console.log(`Cache hit for available vehicles at (${latitude}, ${longitude})`);
            return cachedVehicles;
        }
        console.log(`Cache miss for available vehicles at (${latitude}, ${longitude})`);
        const vehicles = await this.vehicleRepository.findAvailableVehiclesInArea(latitude, longitude, radiusKm);
        await RedisService_1.default.setJson(cacheKey, vehicles, this.CACHE_TTL);
        return vehicles;
    }
}
exports.VehicleService = VehicleService;
//# sourceMappingURL=VehicleService.js.map
import { VehicleRepository } from '../../../shared/database/repositories/VehicleRepository';
import { Vehicle, VehicleStatus, VehicleType } from '../../../shared/types';
import { VehicleValidator } from '../validators/VehicleValidator';
import RedisService from './RedisService';

export class VehicleService {
  private vehicleRepository: VehicleRepository;
  private vehicleValidator: VehicleValidator;
  private readonly CACHE_TTL = 300; // 5 minutes in seconds
  private readonly VEHICLE_CACHE_PREFIX = 'vehicle:';
  private readonly AVAILABLE_VEHICLES_CACHE_PREFIX = 'available_vehicles:';

  constructor(vehicleRepository: VehicleRepository, vehicleValidator: VehicleValidator) {
    this.vehicleRepository = vehicleRepository;
    this.vehicleValidator = vehicleValidator;
  }

  /**
   * Find all vehicles with optional pagination
   */
  async findAll(limit?: number, offset?: number): Promise<Vehicle[]> {
    return this.vehicleRepository.findAll(limit, offset);
  }

  /**
   * Find vehicle by ID
   */
  async findById(id: string): Promise<Vehicle | null> {
    // Try to get from cache first
    const cacheKey = `${this.VEHICLE_CACHE_PREFIX}${id}`;
    const cachedVehicle = await RedisService.getJson<Vehicle>(cacheKey);
    
    if (cachedVehicle) {
      return cachedVehicle;
    }
    
    // If not in cache, get from database
    const vehicle = await this.vehicleRepository.findById(id);
    
    // Cache the result if found
    if (vehicle) {
      await RedisService.setJson(cacheKey, vehicle, this.CACHE_TTL);
    }
    
    return vehicle;
  }

  /**
   * Find vehicles by status
   */
  async findByStatus(status: VehicleStatus, page: number = 1, pageSize: number = 20): Promise<{
    items: Vehicle[];
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    }
  }> {
    return this.vehicleRepository.findByStatus(status, page, pageSize);
  }
  
  /**
   * Find all vehicles by status (without pagination)
   */
  async findAllByStatus(status: VehicleStatus): Promise<Vehicle[]> {
    return this.vehicleRepository.findAllByStatus(status);
  }

  /**
   * Find vehicle by license plate
   */
  async findByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
    return this.vehicleRepository.findByLicensePlate(licensePlate);
  }

  /**
   * Find vehicle by driver ID
   */
  async findByDriverId(driverId: string): Promise<Vehicle | null> {
    return this.vehicleRepository.findByDriverId(driverId);
  }

  /**
   * Find vehicles by type
   */
  async findByType(type: string): Promise<Vehicle[]> {
    if (!Object.values(VehicleType).includes(type as VehicleType)) {
      throw new Error(`Invalid vehicle type: ${type}`);
    }
    return this.vehicleRepository.findByType(type as VehicleType);
  }

  /**
   * Create a new vehicle
   */
  async create(vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> {
    // Validate vehicle data
    const { error } = this.vehicleValidator.validateVehicle(vehicleData);
    if (error) {
      throw new Error(`Vehicle validation error: ${error.message}`);
    }

    // Set default status if not provided
    if (!vehicleData.status) {
      vehicleData.status = VehicleStatus.AVAILABLE;
    }

    return this.vehicleRepository.create(vehicleData);
  }

  /**
   * Update an existing vehicle
   */
  async update(id: string, updates: Partial<Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Vehicle | null> {
    // Validate updates
    const { error } = this.vehicleValidator.validateVehicleUpdates(updates);
    if (error) {
      throw new Error(`Vehicle validation error: ${error.message}`);
    }

    // Invalidate vehicle cache
    await RedisService.del(`${this.VEHICLE_CACHE_PREFIX}${id}`);
    
    // If status or location is being updated, invalidate available vehicles cache
    if (updates.status || updates.currentLocation) {
      await RedisService.invalidatePattern(`${this.AVAILABLE_VEHICLES_CACHE_PREFIX}*`);
    }

    return this.vehicleRepository.update(id, updates);
  }

  /**
   * Delete a vehicle
   */
  async delete(id: string): Promise<boolean> {
    return this.vehicleRepository.delete(id);
  }

  /**
   * Update vehicle status
   */
  async updateStatus(id: string, status: VehicleStatus): Promise<Vehicle | null> {
    // Invalidate vehicle cache
    await RedisService.del(`${this.VEHICLE_CACHE_PREFIX}${id}`);
    
    // Invalidate available vehicles cache when status changes
    await RedisService.invalidatePattern(`${this.AVAILABLE_VEHICLES_CACHE_PREFIX}*`);
    
    return this.vehicleRepository.updateStatus(id, status);
  }

  /**
   * Update vehicle location
   */
  async updateLocation(id: string, latitude: number, longitude: number): Promise<Vehicle | null> {
    // Invalidate vehicle cache
    await RedisService.del(`${this.VEHICLE_CACHE_PREFIX}${id}`);
    
    // Invalidate available vehicles cache when location changes
    await RedisService.invalidatePattern(`${this.AVAILABLE_VEHICLES_CACHE_PREFIX}*`);
    
    return this.vehicleRepository.updateLocation(id, latitude, longitude);
  }

  /**
   * Find available vehicles in an area
   */
  async findAvailableVehiclesInArea(latitude: number, longitude: number, radiusKm: number = 50): Promise<Vehicle[]> {
    // Create a cache key based on the search parameters
    const cacheKey = `${this.AVAILABLE_VEHICLES_CACHE_PREFIX}lat:${latitude.toFixed(4)}_lng:${longitude.toFixed(4)}_rad:${radiusKm}`;
    
    // Try to get from cache first
    const cachedVehicles = await RedisService.getJson<Vehicle[]>(cacheKey);
    
    if (cachedVehicles) {
      console.log(`Cache hit for available vehicles at (${latitude}, ${longitude})`);
      return cachedVehicles;
    }
    
    // If not in cache, get from database
    console.log(`Cache miss for available vehicles at (${latitude}, ${longitude})`);
    const vehicles = await this.vehicleRepository.findAvailableVehiclesInArea(latitude, longitude, radiusKm);
    
    // Cache the result
    await RedisService.setJson(cacheKey, vehicles, this.CACHE_TTL);
    
    return vehicles;
  }
}
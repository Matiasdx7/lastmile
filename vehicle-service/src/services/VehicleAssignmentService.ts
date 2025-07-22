import { VehicleRepository } from '../../../shared/database/repositories/VehicleRepository';
import { LoadRepository } from '../../../shared/database/repositories/LoadRepository';
import { Vehicle, VehicleStatus, VehicleType, Load, LoadStatus } from '../../../shared/types';

export interface AssignmentCriteria {
  prioritizeProximity?: boolean;
  maxDistanceKm?: number;
  preferredVehicleType?: VehicleType;
  considerDriverExperience?: boolean;
}

export class VehicleAssignmentService {
  constructor(
    private vehicleRepository: VehicleRepository,
    private loadRepository: LoadRepository
  ) {}

  /**
   * Find the best vehicle for a specific load based on capacity and other criteria
   * @param loadId ID of the load to assign a vehicle to
   * @param criteria Optional criteria for vehicle selection
   * @returns The assigned vehicle or null if no suitable vehicle found
   */
  async assignVehicleToLoad(loadId: string, criteria: AssignmentCriteria = {}): Promise<Vehicle | null> {
    // Get the load details
    const load = await this.loadRepository.findById(loadId);
    if (!load) {
      throw new Error(`Load with ID ${loadId} not found`);
    }

    // Check if load is already assigned to a vehicle
    if (load.vehicleId) {
      throw new Error(`Load ${loadId} is already assigned to vehicle ${load.vehicleId}`);
    }

    // Check if load is in the right status for assignment
    if (load.status !== LoadStatus.CONSOLIDATED) {
      throw new Error(`Load ${loadId} is not in CONSOLIDATED status and cannot be assigned`);
    }

    // Find available vehicles that can handle this load's capacity
    const suitableVehicles = await this.findSuitableVehicles(load, criteria);
    
    if (suitableVehicles.length === 0) {
      return null;
    }

    // Select the best vehicle based on criteria
    const bestVehicle = this.selectBestVehicle(suitableVehicles, load, criteria);
    
    if (!bestVehicle) {
      return null;
    }

    // Assign the vehicle to the load
    await this.loadRepository.assignVehicle(loadId, bestVehicle.id);
    await this.loadRepository.updateStatus(loadId, LoadStatus.ASSIGNED);
    
    // Update vehicle status
    await this.vehicleRepository.updateStatus(bestVehicle.id, VehicleStatus.ASSIGNED);

    return bestVehicle;
  }

  /**
   * Find vehicles that have sufficient capacity for the load
   * @param load The load to find vehicles for
   * @param criteria Optional criteria for vehicle selection
   * @returns Array of suitable vehicles
   */
  private async findSuitableVehicles(load: Load, criteria: AssignmentCriteria): Promise<Vehicle[]> {
    // Get all available vehicles
    const availableVehiclesResult = await this.vehicleRepository.findByStatus(VehicleStatus.AVAILABLE);
    const availableVehicles = availableVehiclesResult.items;
    
    // Filter vehicles by capacity
    const suitableVehicles = availableVehicles.filter((vehicle: Vehicle) => {
      // Check if vehicle has enough capacity for the load
      return (
        vehicle.capacity.maxWeight >= load.totalWeight &&
        vehicle.capacity.maxVolume >= load.totalVolume
      );
    });

    // Apply additional filters based on criteria
    let filteredVehicles = suitableVehicles;

    // Filter by vehicle type if specified
    if (criteria.preferredVehicleType) {
      const typeMatches = filteredVehicles.filter((v: Vehicle) => v.type === criteria.preferredVehicleType);
      if (typeMatches.length > 0) {
        filteredVehicles = typeMatches;
      }
    }

    // Filter by proximity if location is available and proximity is prioritized
    if (criteria.prioritizeProximity && criteria.maxDistanceKm && load.orders.length > 0) {
      // For simplicity, we'll use the first order's delivery location as reference
      // In a real implementation, you might want to calculate the centroid of all delivery locations
      // This would require fetching all orders and their delivery locations
      
      // This is a simplified version - in a real implementation, you would:
      // 1. Get all orders in the load
      // 2. Extract their delivery locations
      // 3. Calculate a central point (centroid)
      // 4. Filter vehicles based on distance to this point
      
      // For now, we'll just return the filtered vehicles without location filtering
      // as implementing the full logic would require additional repositories and data access
    }

    return filteredVehicles;
  }

  /**
   * Select the best vehicle from a list of suitable vehicles
   * @param vehicles List of suitable vehicles
   * @param load The load to be assigned
   * @param criteria Selection criteria
   * @returns The best vehicle or null if none found
   */
  private selectBestVehicle(vehicles: Vehicle[], load: Load, criteria: AssignmentCriteria): Vehicle | null {
    if (vehicles.length === 0) {
      return null;
    }

    // If only one vehicle is available, return it
    if (vehicles.length === 1) {
      return vehicles[0];
    }

    // Sort vehicles by capacity efficiency (minimize wasted capacity)
    const sortedVehicles = [...vehicles].sort((a, b) => {
      // Calculate capacity utilization percentage for weight
      const aWeightUtilization = load.totalWeight / a.capacity.maxWeight;
      const bWeightUtilization = load.totalWeight / b.capacity.maxWeight;
      
      // Calculate capacity utilization percentage for volume
      const aVolumeUtilization = load.totalVolume / a.capacity.maxVolume;
      const bVolumeUtilization = load.totalVolume / b.capacity.maxVolume;
      
      // Calculate average utilization
      const aAvgUtilization = (aWeightUtilization + aVolumeUtilization) / 2;
      const bAvgUtilization = (bWeightUtilization + bVolumeUtilization) / 2;
      
      // Sort by highest utilization (most efficient use of capacity)
      // We want the vehicle that will be most efficiently utilized
      return bAvgUtilization - aAvgUtilization;
    });

    // Return the most efficient vehicle
    return sortedVehicles[0];
  }

  /**
   * Unassign a vehicle from a load
   * @param loadId ID of the load
   * @returns Boolean indicating success
   */
  async unassignVehicleFromLoad(loadId: string): Promise<boolean> {
    const load = await this.loadRepository.findById(loadId);
    if (!load) {
      throw new Error(`Load with ID ${loadId} not found`);
    }

    if (!load.vehicleId) {
      throw new Error(`Load ${loadId} is not assigned to any vehicle`);
    }

    // Get the vehicle
    const vehicle = await this.vehicleRepository.findById(load.vehicleId);
    
    // Update load
    await this.loadRepository.update(loadId, { 
      vehicleId: undefined,
      status: LoadStatus.CONSOLIDATED
    } as any);
    
    // Update vehicle status if it exists
    if (vehicle) {
      await this.vehicleRepository.updateStatus(vehicle.id, VehicleStatus.AVAILABLE);
    }

    return true;
  }

  /**
   * Get all loads assigned to a specific vehicle
   * @param vehicleId ID of the vehicle
   * @returns Array of loads assigned to the vehicle
   */
  async getLoadsForVehicle(vehicleId: string): Promise<Load[]> {
    return this.loadRepository.findByVehicleId(vehicleId);
  }

  /**
   * Find and assign vehicles to all unassigned loads
   * @param criteria Optional criteria for vehicle selection
   * @returns Object containing successful and failed assignments
   */
  async batchAssignVehiclesToLoads(criteria: AssignmentCriteria = {}): Promise<{
    successful: { loadId: string, vehicleId: string }[];
    failed: string[];
  }> {
    // Get all unassigned loads
    const unassignedLoads = await this.loadRepository.findUnassignedLoads();
    
    const successful: { loadId: string, vehicleId: string }[] = [];
    const failed: string[] = [];

    // Process each load
    for (const load of unassignedLoads) {
      try {
        const vehicle = await this.assignVehicleToLoad(load.id, criteria);
        
        if (vehicle) {
          successful.push({ loadId: load.id, vehicleId: vehicle.id });
        } else {
          failed.push(load.id);
        }
      } catch (error) {
        console.error(`Error assigning vehicle to load ${load.id}:`, error);
        failed.push(load.id);
      }
    }

    return { successful, failed };
  }

  /**
   * Check if a vehicle has sufficient capacity for a load
   * @param vehicleId ID of the vehicle
   * @param loadId ID of the load
   * @returns Boolean indicating if the vehicle can handle the load
   */
  async checkVehicleCapacityForLoad(vehicleId: string, loadId: string): Promise<boolean> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    const load = await this.loadRepository.findById(loadId);

    if (!vehicle || !load) {
      return false;
    }

    return (
      vehicle.capacity.maxWeight >= load.totalWeight &&
      vehicle.capacity.maxVolume >= load.totalVolume
    );
  }
}
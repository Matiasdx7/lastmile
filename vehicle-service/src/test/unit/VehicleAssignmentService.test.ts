import { VehicleAssignmentService, AssignmentCriteria } from '../../services/VehicleAssignmentService';
import { VehicleRepository } from '../../../../shared/database/repositories/VehicleRepository';
import { LoadRepository } from '../../../../shared/database/repositories/LoadRepository';
import { Vehicle, VehicleStatus, VehicleType, Load, LoadStatus } from '../../../../shared/types';

// Mock repositories
const mockVehicleRepository = {
  findById: jest.fn(),
  findByStatus: jest.fn(),
  updateStatus: jest.fn(),
  update: jest.fn()
} as unknown as jest.Mocked<VehicleRepository>;

const mockLoadRepository = {
  findById: jest.fn(),
  findByVehicleId: jest.fn(),
  findUnassignedLoads: jest.fn(),
  assignVehicle: jest.fn(),
  updateStatus: jest.fn(),
  update: jest.fn()
} as unknown as jest.Mocked<LoadRepository>;

// Sample data
const mockVehicles: Vehicle[] = [
  {
    id: 'v1',
    licensePlate: 'ABC123',
    type: VehicleType.VAN,
    capacity: {
      maxWeight: 1000,
      maxVolume: 10,
      maxPackages: 50
    },
    status: VehicleStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'v2',
    licensePlate: 'XYZ789',
    type: VehicleType.TRUCK,
    capacity: {
      maxWeight: 2000,
      maxVolume: 20,
      maxPackages: 100
    },
    status: VehicleStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'v3',
    licensePlate: 'DEF456',
    type: VehicleType.MOTORCYCLE,
    capacity: {
      maxWeight: 100,
      maxVolume: 1,
      maxPackages: 5
    },
    status: VehicleStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockLoad: Load = {
  id: 'l1',
  orders: ['o1', 'o2'],
  totalWeight: 500,
  totalVolume: 5,
  status: LoadStatus.CONSOLIDATED,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockAssignedLoad: Load = {
  ...mockLoad,
  vehicleId: 'v1',
  status: LoadStatus.ASSIGNED
};

describe('VehicleAssignmentService', () => {
  let vehicleAssignmentService: VehicleAssignmentService;

  beforeEach(() => {
    jest.clearAllMocks();
    vehicleAssignmentService = new VehicleAssignmentService(
      mockVehicleRepository,
      mockLoadRepository
    );
  });

  describe('assignVehicleToLoad', () => {
    it('should assign a vehicle to a load successfully', async () => {
      // Setup
      mockLoadRepository.findById.mockResolvedValue(mockLoad);
      mockVehicleRepository.findByStatus.mockResolvedValue([mockVehicles[0], mockVehicles[1]]);
      mockLoadRepository.assignVehicle.mockResolvedValue(mockAssignedLoad);
      mockLoadRepository.updateStatus.mockResolvedValue(mockAssignedLoad);
      mockVehicleRepository.updateStatus.mockResolvedValue({
        ...mockVehicles[0],
        status: VehicleStatus.ASSIGNED
      });

      // Execute
      const result = await vehicleAssignmentService.assignVehicleToLoad('l1');

      // Assert
      expect(mockLoadRepository.findById).toHaveBeenCalledWith('l1');
      expect(mockVehicleRepository.findByStatus).toHaveBeenCalledWith(VehicleStatus.AVAILABLE);
      expect(mockLoadRepository.assignVehicle).toHaveBeenCalledWith('l1', mockVehicles[0].id);
      expect(mockLoadRepository.updateStatus).toHaveBeenCalledWith('l1', LoadStatus.ASSIGNED);
      expect(mockVehicleRepository.updateStatus).toHaveBeenCalledWith(mockVehicles[0].id, VehicleStatus.ASSIGNED);
      expect(result).toEqual(mockVehicles[0]);
    });

    it('should throw error if load not found', async () => {
      // Setup
      mockLoadRepository.findById.mockResolvedValue(null);

      // Execute & Assert
      await expect(vehicleAssignmentService.assignVehicleToLoad('l999'))
        .rejects
        .toThrow('Load with ID l999 not found');
    });

    it('should throw error if load already has a vehicle assigned', async () => {
      // Setup
      mockLoadRepository.findById.mockResolvedValue({
        ...mockLoad,
        vehicleId: 'v1'
      });

      // Execute & Assert
      await expect(vehicleAssignmentService.assignVehicleToLoad('l1'))
        .rejects
        .toThrow('Load l1 is already assigned to vehicle v1');
    });

    it('should throw error if load is not in CONSOLIDATED status', async () => {
      // Setup
      mockLoadRepository.findById.mockResolvedValue({
        ...mockLoad,
        status: LoadStatus.PENDING
      });

      // Execute & Assert
      await expect(vehicleAssignmentService.assignVehicleToLoad('l1'))
        .rejects
        .toThrow('Load l1 is not in CONSOLIDATED status and cannot be assigned');
    });

    it('should return null if no suitable vehicles found', async () => {
      // Setup
      mockLoadRepository.findById.mockResolvedValue({
        ...mockLoad,
        totalWeight: 5000, // Too heavy for any vehicle
        totalVolume: 50    // Too large for any vehicle
      });
      mockVehicleRepository.findByStatus.mockResolvedValue(mockVehicles);

      // Execute
      const result = await vehicleAssignmentService.assignVehicleToLoad('l1');

      // Assert
      expect(result).toBeNull();
    });

    it('should filter vehicles by preferred type', async () => {
      // Setup
      mockLoadRepository.findById.mockResolvedValue(mockLoad);
      mockVehicleRepository.findByStatus.mockResolvedValue(mockVehicles);
      mockLoadRepository.assignVehicle.mockResolvedValue(mockAssignedLoad);
      mockLoadRepository.updateStatus.mockResolvedValue(mockAssignedLoad);
      mockVehicleRepository.updateStatus.mockResolvedValue({
        ...mockVehicles[1],
        status: VehicleStatus.ASSIGNED
      });

      const criteria: AssignmentCriteria = {
        preferredVehicleType: VehicleType.TRUCK
      };

      // Execute
      const result = await vehicleAssignmentService.assignVehicleToLoad('l1', criteria);

      // Assert
      expect(result).toEqual(mockVehicles[1]); // Should select the TRUCK
    });

    it('should select the most efficient vehicle based on capacity utilization', async () => {
      // Setup
      const smallLoad = {
        ...mockLoad,
        totalWeight: 80,
        totalVolume: 0.8
      };
      
      mockLoadRepository.findById.mockResolvedValue(smallLoad);
      mockVehicleRepository.findByStatus.mockResolvedValue(mockVehicles);
      mockLoadRepository.assignVehicle.mockResolvedValue({...smallLoad, vehicleId: 'v3'});
      mockLoadRepository.updateStatus.mockResolvedValue({...smallLoad, vehicleId: 'v3', status: LoadStatus.ASSIGNED});
      mockVehicleRepository.updateStatus.mockResolvedValue({
        ...mockVehicles[2],
        status: VehicleStatus.ASSIGNED
      });

      // Execute
      const result = await vehicleAssignmentService.assignVehicleToLoad('l1');

      // Assert
      expect(result).toEqual(mockVehicles[2]); // Should select the MOTORCYCLE as it's most efficient for this load
    });
  });

  describe('unassignVehicleFromLoad', () => {
    it('should unassign a vehicle from a load successfully', async () => {
      // Setup
      mockLoadRepository.findById.mockResolvedValue({
        ...mockLoad,
        vehicleId: 'v1',
        status: LoadStatus.ASSIGNED
      });
      mockVehicleRepository.findById.mockResolvedValue(mockVehicles[0]);
      mockLoadRepository.update.mockResolvedValue({
        ...mockLoad,
        vehicleId: undefined,
        status: LoadStatus.CONSOLIDATED
      });
      mockVehicleRepository.updateStatus.mockResolvedValue({
        ...mockVehicles[0],
        status: VehicleStatus.AVAILABLE
      });

      // Execute
      const result = await vehicleAssignmentService.unassignVehicleFromLoad('l1');

      // Assert
      expect(mockLoadRepository.findById).toHaveBeenCalledWith('l1');
      expect(mockVehicleRepository.findById).toHaveBeenCalledWith('v1');
      expect(mockLoadRepository.update).toHaveBeenCalledWith('l1', expect.objectContaining({
        vehicleId: undefined,
        status: LoadStatus.CONSOLIDATED
      }));
      expect(mockVehicleRepository.updateStatus).toHaveBeenCalledWith('v1', VehicleStatus.AVAILABLE);
      expect(result).toBe(true);
    });

    it('should throw error if load not found', async () => {
      // Setup
      mockLoadRepository.findById.mockResolvedValue(null);

      // Execute & Assert
      await expect(vehicleAssignmentService.unassignVehicleFromLoad('l999'))
        .rejects
        .toThrow('Load with ID l999 not found');
    });

    it('should throw error if load has no vehicle assigned', async () => {
      // Setup
      mockLoadRepository.findById.mockResolvedValue(mockLoad); // No vehicleId

      // Execute & Assert
      await expect(vehicleAssignmentService.unassignVehicleFromLoad('l1'))
        .rejects
        .toThrow('Load l1 is not assigned to any vehicle');
    });

    it('should handle case when vehicle is not found but still update load', async () => {
      // Setup
      mockLoadRepository.findById.mockResolvedValue({
        ...mockLoad,
        vehicleId: 'v999', // Non-existent vehicle
        status: LoadStatus.ASSIGNED
      });
      mockVehicleRepository.findById.mockResolvedValue(null);
      mockLoadRepository.update.mockResolvedValue({
        ...mockLoad,
        vehicleId: undefined,
        status: LoadStatus.CONSOLIDATED
      });

      // Execute
      const result = await vehicleAssignmentService.unassignVehicleFromLoad('l1');

      // Assert
      expect(mockLoadRepository.update).toHaveBeenCalledWith('l1', expect.objectContaining({
        vehicleId: undefined,
        status: LoadStatus.CONSOLIDATED
      }));
      expect(mockVehicleRepository.updateStatus).not.toHaveBeenCalled(); // Should not try to update non-existent vehicle
      expect(result).toBe(true);
    });
  });

  describe('getLoadsForVehicle', () => {
    it('should return loads assigned to a vehicle', async () => {
      // Setup
      const mockLoads = [
        { ...mockLoad, vehicleId: 'v1' },
        { ...mockLoad, id: 'l2', vehicleId: 'v1' }
      ];
      mockLoadRepository.findByVehicleId.mockResolvedValue(mockLoads);

      // Execute
      const result = await vehicleAssignmentService.getLoadsForVehicle('v1');

      // Assert
      expect(mockLoadRepository.findByVehicleId).toHaveBeenCalledWith('v1');
      expect(result).toEqual(mockLoads);
    });

    it('should return empty array if no loads found for vehicle', async () => {
      // Setup
      mockLoadRepository.findByVehicleId.mockResolvedValue([]);

      // Execute
      const result = await vehicleAssignmentService.getLoadsForVehicle('v1');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('batchAssignVehiclesToLoads', () => {
    it('should assign vehicles to multiple loads', async () => {
      // Setup
      const unassignedLoads = [
        { ...mockLoad, id: 'l1' },
        { ...mockLoad, id: 'l2' }
      ];
      
      mockLoadRepository.findUnassignedLoads.mockResolvedValue(unassignedLoads);
      
      // Mock assignVehicleToLoad to succeed for first load and fail for second
      jest.spyOn(vehicleAssignmentService, 'assignVehicleToLoad')
        .mockImplementation(async (loadId) => {
          if (loadId === 'l1') {
            return mockVehicles[0];
          } else {
            return null;
          }
        });

      // Execute
      const result = await vehicleAssignmentService.batchAssignVehiclesToLoads();

      // Assert
      expect(mockLoadRepository.findUnassignedLoads).toHaveBeenCalled();
      expect(vehicleAssignmentService.assignVehicleToLoad).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        successful: [{ loadId: 'l1', vehicleId: 'v1' }],
        failed: ['l2']
      });
    });

    it('should handle errors during assignment', async () => {
      // Setup
      mockLoadRepository.findUnassignedLoads.mockResolvedValue([
        { ...mockLoad, id: 'l1' },
        { ...mockLoad, id: 'l2' }
      ]);
      
      jest.spyOn(vehicleAssignmentService, 'assignVehicleToLoad')
        .mockImplementation(async (loadId) => {
          if (loadId === 'l1') {
            return mockVehicles[0];
          } else {
            throw new Error('Test error');
          }
        });

      // Execute
      const result = await vehicleAssignmentService.batchAssignVehiclesToLoads();

      // Assert
      expect(result).toEqual({
        successful: [{ loadId: 'l1', vehicleId: 'v1' }],
        failed: ['l2']
      });
    });

    it('should return empty results if no unassigned loads', async () => {
      // Setup
      mockLoadRepository.findUnassignedLoads.mockResolvedValue([]);

      // Execute
      const result = await vehicleAssignmentService.batchAssignVehiclesToLoads();

      // Assert
      expect(result).toEqual({
        successful: [],
        failed: []
      });
    });
  });

  describe('checkVehicleCapacityForLoad', () => {
    it('should return true if vehicle has sufficient capacity', async () => {
      // Setup
      mockVehicleRepository.findById.mockResolvedValue(mockVehicles[0]);
      mockLoadRepository.findById.mockResolvedValue(mockLoad);

      // Execute
      const result = await vehicleAssignmentService.checkVehicleCapacityForLoad('v1', 'l1');

      // Assert
      expect(mockVehicleRepository.findById).toHaveBeenCalledWith('v1');
      expect(mockLoadRepository.findById).toHaveBeenCalledWith('l1');
      expect(result).toBe(true);
    });

    it('should return false if vehicle does not have sufficient weight capacity', async () => {
      // Setup
      mockVehicleRepository.findById.mockResolvedValue(mockVehicles[2]); // Motorcycle
      mockLoadRepository.findById.mockResolvedValue({
        ...mockLoad,
        totalWeight: 200 // Too heavy for motorcycle
      });

      // Execute
      const result = await vehicleAssignmentService.checkVehicleCapacityForLoad('v3', 'l1');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false if vehicle does not have sufficient volume capacity', async () => {
      // Setup
      mockVehicleRepository.findById.mockResolvedValue(mockVehicles[2]); // Motorcycle
      mockLoadRepository.findById.mockResolvedValue({
        ...mockLoad,
        totalVolume: 2 // Too large for motorcycle
      });

      // Execute
      const result = await vehicleAssignmentService.checkVehicleCapacityForLoad('v3', 'l1');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false if vehicle not found', async () => {
      // Setup
      mockVehicleRepository.findById.mockResolvedValue(null);
      mockLoadRepository.findById.mockResolvedValue(mockLoad);

      // Execute
      const result = await vehicleAssignmentService.checkVehicleCapacityForLoad('v999', 'l1');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false if load not found', async () => {
      // Setup
      mockVehicleRepository.findById.mockResolvedValue(mockVehicles[0]);
      mockLoadRepository.findById.mockResolvedValue(null);

      // Execute
      const result = await vehicleAssignmentService.checkVehicleCapacityForLoad('v1', 'l999');

      // Assert
      expect(result).toBe(false);
    });
  });
});
import { VehicleService } from '../../services/VehicleService';
import { VehicleRepository } from '../../../../shared/database/repositories/VehicleRepository';
import { VehicleValidator } from '../../validators/VehicleValidator';
import { Vehicle, VehicleStatus, VehicleType } from '../../../../shared/types';

// Mock the VehicleRepository
const mockVehicleRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByStatus: jest.fn(),
  findByLicensePlate: jest.fn(),
  findByDriverId: jest.fn(),
  findByType: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  updateStatus: jest.fn(),
  updateLocation: jest.fn(),
  findAvailableVehiclesInArea: jest.fn()
} as unknown as jest.Mocked<VehicleRepository>;

// Mock the VehicleValidator
const mockVehicleValidator = {
  validateVehicle: jest.fn(),
  validateVehicleUpdates: jest.fn()
} as unknown as jest.Mocked<VehicleValidator>;

// Sample data
const mockVehicle: Vehicle = {
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
};

describe('VehicleService', () => {
  let vehicleService: VehicleService;

  beforeEach(() => {
    jest.clearAllMocks();
    vehicleService = new VehicleService(mockVehicleRepository, mockVehicleValidator);
  });

  describe('findAll', () => {
    it('should return all vehicles', async () => {
      // Setup
      const vehicles = [mockVehicle];
      mockVehicleRepository.findAll.mockResolvedValue(vehicles);

      // Execute
      const result = await vehicleService.findAll();

      // Assert
      expect(mockVehicleRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(vehicles);
    });

    it('should pass limit and offset parameters', async () => {
      // Setup
      mockVehicleRepository.findAll.mockResolvedValue([]);

      // Execute
      await vehicleService.findAll(10, 20);

      // Assert
      expect(mockVehicleRepository.findAll).toHaveBeenCalledWith(10, 20);
    });
  });

  describe('findById', () => {
    it('should return a vehicle by ID', async () => {
      // Setup
      mockVehicleRepository.findById.mockResolvedValue(mockVehicle);

      // Execute
      const result = await vehicleService.findById('v1');

      // Assert
      expect(mockVehicleRepository.findById).toHaveBeenCalledWith('v1');
      expect(result).toEqual(mockVehicle);
    });

    it('should return null if vehicle not found', async () => {
      // Setup
      mockVehicleRepository.findById.mockResolvedValue(null);

      // Execute
      const result = await vehicleService.findById('v999');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByStatus', () => {
    it('should return vehicles by status', async () => {
      // Setup
      const vehicles = [mockVehicle];
      mockVehicleRepository.findByStatus.mockResolvedValue(vehicles);

      // Execute
      const result = await vehicleService.findByStatus(VehicleStatus.AVAILABLE);

      // Assert
      expect(mockVehicleRepository.findByStatus).toHaveBeenCalledWith(VehicleStatus.AVAILABLE);
      expect(result).toEqual(vehicles);
    });

    it('should return empty array if no vehicles with status', async () => {
      // Setup
      mockVehicleRepository.findByStatus.mockResolvedValue([]);

      // Execute
      const result = await vehicleService.findByStatus(VehicleStatus.MAINTENANCE);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findByLicensePlate', () => {
    it('should return a vehicle by license plate', async () => {
      // Setup
      mockVehicleRepository.findByLicensePlate.mockResolvedValue(mockVehicle);

      // Execute
      const result = await vehicleService.findByLicensePlate('ABC123');

      // Assert
      expect(mockVehicleRepository.findByLicensePlate).toHaveBeenCalledWith('ABC123');
      expect(result).toEqual(mockVehicle);
    });

    it('should return null if no vehicle with license plate', async () => {
      // Setup
      mockVehicleRepository.findByLicensePlate.mockResolvedValue(null);

      // Execute
      const result = await vehicleService.findByLicensePlate('XYZ999');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByDriverId', () => {
    it('should return a vehicle by driver ID', async () => {
      // Setup
      const vehicleWithDriver = { ...mockVehicle, driverId: 'd1' };
      mockVehicleRepository.findByDriverId.mockResolvedValue(vehicleWithDriver);

      // Execute
      const result = await vehicleService.findByDriverId('d1');

      // Assert
      expect(mockVehicleRepository.findByDriverId).toHaveBeenCalledWith('d1');
      expect(result).toEqual(vehicleWithDriver);
    });

    it('should return null if no vehicle with driver ID', async () => {
      // Setup
      mockVehicleRepository.findByDriverId.mockResolvedValue(null);

      // Execute
      const result = await vehicleService.findByDriverId('d999');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByType', () => {
    it('should return vehicles by type', async () => {
      // Setup
      const vehicles = [mockVehicle];
      mockVehicleRepository.findByType.mockResolvedValue(vehicles);

      // Execute
      const result = await vehicleService.findByType(VehicleType.VAN);

      // Assert
      expect(mockVehicleRepository.findByType).toHaveBeenCalledWith(VehicleType.VAN);
      expect(result).toEqual(vehicles);
    });

    it('should throw error for invalid vehicle type', async () => {
      // Execute & Assert
      await expect(vehicleService.findByType('INVALID_TYPE' as VehicleType))
        .rejects
        .toThrow('Invalid vehicle type: INVALID_TYPE');
    });
  });

  describe('create', () => {
    it('should create a new vehicle', async () => {
      // Setup
      const vehicleData = {
        licensePlate: 'XYZ789',
        type: VehicleType.TRUCK,
        capacity: {
          maxWeight: 2000,
          maxVolume: 20,
          maxPackages: 100
        }
      };
      
      mockVehicleValidator.validateVehicle.mockReturnValue({ error: undefined, value: vehicleData });
      mockVehicleRepository.create.mockResolvedValue({
        ...vehicleData,
        id: 'v2',
        status: VehicleStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Vehicle);

      // Execute
      const result = await vehicleService.create(vehicleData as any);

      // Assert
      expect(mockVehicleValidator.validateVehicle).toHaveBeenCalledWith(expect.objectContaining(vehicleData));
      expect(mockVehicleRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        ...vehicleData,
        status: VehicleStatus.AVAILABLE
      }));
      expect(result.id).toBe('v2');
      expect(result.licensePlate).toBe('XYZ789');
    });

    it('should set default status if not provided', async () => {
      // Setup
      const vehicleData = {
        licensePlate: 'XYZ789',
        type: VehicleType.TRUCK,
        capacity: {
          maxWeight: 2000,
          maxVolume: 20,
          maxPackages: 100
        }
      };
      
      mockVehicleValidator.validateVehicle.mockReturnValue({ error: undefined, value: vehicleData });
      mockVehicleRepository.create.mockResolvedValue({
        ...vehicleData,
        id: 'v2',
        status: VehicleStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Vehicle);

      // Execute
      await vehicleService.create(vehicleData as any);

      // Assert
      expect(mockVehicleRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        ...vehicleData,
        status: VehicleStatus.AVAILABLE
      }));
    });

    it('should throw error if validation fails', async () => {
      // Setup
      const vehicleData = {
        // Missing required fields
        licensePlate: 'XYZ789'
      };
      
      // Mock the error message directly
      mockVehicleValidator.validateVehicle.mockImplementation(() => {
        const error = new Error('type is required') as any;
        error.isJoi = true;
        error.name = 'ValidationError';
        error.details = [];
        error._original = vehicleData;
        error.annotate = jest.fn();
        
        return {
          error,
          value: vehicleData
        };
      });

      // Execute & Assert
      await expect(vehicleService.create(vehicleData as any))
        .rejects
        .toThrow('Vehicle validation error: type is required');
    });
  });

  describe('update', () => {
    it('should update an existing vehicle', async () => {
      // Setup
      const updates = {
        capacity: {
          maxWeight: 1500,
          maxVolume: 15,
          maxPackages: 75
        }
      };
      
      mockVehicleValidator.validateVehicleUpdates.mockReturnValue({ error: undefined, value: updates });
      mockVehicleRepository.update.mockResolvedValue({
        ...mockVehicle,
        ...updates
      });

      // Execute
      const result = await vehicleService.update('v1', updates as any);

      // Assert
      expect(mockVehicleValidator.validateVehicleUpdates).toHaveBeenCalledWith(updates);
      expect(mockVehicleRepository.update).toHaveBeenCalledWith('v1', updates);
      expect(result).toEqual(expect.objectContaining({
        id: 'v1',
        capacity: updates.capacity
      }));
    });

    it('should throw error if validation fails', async () => {
      // Setup
      const updates = {
        capacity: {
          maxWeight: -100 // Invalid negative weight
        }
      };
      
      // Mock the error message directly
      mockVehicleValidator.validateVehicleUpdates.mockImplementation(() => {
        const error = new Error('maxWeight must be greater than or equal to 0') as any;
        error.isJoi = true;
        error.name = 'ValidationError';
        error.details = [];
        error._original = updates;
        error.annotate = jest.fn();
        
        return {
          error,
          value: updates
        };
      });

      // Execute & Assert
      await expect(vehicleService.update('v1', updates as any))
        .rejects
        .toThrow('Vehicle validation error: maxWeight must be greater than or equal to 0');
    });

    it('should return null if vehicle not found', async () => {
      // Setup
      mockVehicleValidator.validateVehicleUpdates.mockReturnValue({ error: undefined, value: { status: VehicleStatus.MAINTENANCE } });
      mockVehicleRepository.update.mockResolvedValue(null);

      // Execute
      const result = await vehicleService.update('v999', { status: VehicleStatus.MAINTENANCE } as any);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a vehicle', async () => {
      // Setup
      mockVehicleRepository.delete.mockResolvedValue(true);

      // Execute
      const result = await vehicleService.delete('v1');

      // Assert
      expect(mockVehicleRepository.delete).toHaveBeenCalledWith('v1');
      expect(result).toBe(true);
    });

    it('should return false if vehicle not found', async () => {
      // Setup
      mockVehicleRepository.delete.mockResolvedValue(false);

      // Execute
      const result = await vehicleService.delete('v999');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('updateStatus', () => {
    it('should update vehicle status', async () => {
      // Setup
      mockVehicleRepository.updateStatus.mockResolvedValue({
        ...mockVehicle,
        status: VehicleStatus.MAINTENANCE
      });

      // Execute
      const result = await vehicleService.updateStatus('v1', VehicleStatus.MAINTENANCE);

      // Assert
      expect(mockVehicleRepository.updateStatus).toHaveBeenCalledWith('v1', VehicleStatus.MAINTENANCE);
      expect(result?.status).toBe(VehicleStatus.MAINTENANCE);
    });

    it('should return null if vehicle not found', async () => {
      // Setup
      mockVehicleRepository.updateStatus.mockResolvedValue(null);

      // Execute
      const result = await vehicleService.updateStatus('v999', VehicleStatus.MAINTENANCE);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateLocation', () => {
    it('should update vehicle location', async () => {
      // Setup
      const newLocation = { latitude: 40.7128, longitude: -74.0060 };
      mockVehicleRepository.updateLocation.mockResolvedValue({
        ...mockVehicle,
        currentLocation: newLocation
      });

      // Execute
      const result = await vehicleService.updateLocation('v1', 40.7128, -74.0060);

      // Assert
      expect(mockVehicleRepository.updateLocation).toHaveBeenCalledWith('v1', 40.7128, -74.0060);
      expect(result?.currentLocation).toEqual(newLocation);
    });

    it('should return null if vehicle not found', async () => {
      // Setup
      mockVehicleRepository.updateLocation.mockResolvedValue(null);

      // Execute
      const result = await vehicleService.updateLocation('v999', 40.7128, -74.0060);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findAvailableVehiclesInArea', () => {
    it('should find available vehicles in an area', async () => {
      // Setup
      const vehicles = [mockVehicle];
      mockVehicleRepository.findAvailableVehiclesInArea.mockResolvedValue(vehicles);

      // Execute
      const result = await vehicleService.findAvailableVehiclesInArea(40.7128, -74.0060, 10);

      // Assert
      expect(mockVehicleRepository.findAvailableVehiclesInArea).toHaveBeenCalledWith(40.7128, -74.0060, 10);
      expect(result).toEqual(vehicles);
    });

    it('should use default radius if not provided', async () => {
      // Setup
      mockVehicleRepository.findAvailableVehiclesInArea.mockResolvedValue([]);

      // Execute
      await vehicleService.findAvailableVehiclesInArea(40.7128, -74.0060);

      // Assert
      expect(mockVehicleRepository.findAvailableVehiclesInArea).toHaveBeenCalledWith(40.7128, -74.0060, 50);
    });
  });
});
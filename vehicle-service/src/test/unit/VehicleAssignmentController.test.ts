import { Request, Response } from 'express';
import { VehicleAssignmentController } from '../../controllers/VehicleAssignmentController';
import { VehicleAssignmentService } from '../../services/VehicleAssignmentService';
import { Vehicle, VehicleStatus, VehicleType, Load, LoadStatus } from '../../../../shared/types';

// Mock the VehicleAssignmentService
const mockVehicleAssignmentService = {
  assignVehicleToLoad: jest.fn(),
  unassignVehicleFromLoad: jest.fn(),
  getLoadsForVehicle: jest.fn(),
  batchAssignVehiclesToLoads: jest.fn(),
  checkVehicleCapacityForLoad: jest.fn()
} as unknown as jest.Mocked<VehicleAssignmentService>;

// Create mock data
const mockVehicle: Vehicle = {
  id: 'v123',
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

const mockLoad: Load = {
  id: 'l456',
  orders: ['o789', 'o101'],
  totalWeight: 500,
  totalVolume: 5,
  status: LoadStatus.CONSOLIDATED,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock request and response
const mockRequest = () => {
  const req = {} as Request;
  req.body = {};
  req.params = {};
  req.query = {};
  return req;
};

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res;
};

describe('VehicleAssignmentController', () => {
  let vehicleAssignmentController: VehicleAssignmentController;
  let req: Request;
  let res: Response;

  beforeEach(() => {
    vehicleAssignmentController = new VehicleAssignmentController(mockVehicleAssignmentService);
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe('assignVehicleToLoad', () => {
    it('should assign a vehicle to a load', async () => {
      req.params.loadId = 'l456';
      req.body.criteria = {
        prioritizeProximity: true,
        maxDistanceKm: 50
      };
      
      mockVehicleAssignmentService.assignVehicleToLoad.mockResolvedValue(mockVehicle);

      await vehicleAssignmentController.assignVehicleToLoad(req, res);

      expect(mockVehicleAssignmentService.assignVehicleToLoad).toHaveBeenCalledWith('l456', req.body.criteria);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('assigned to load'),
        assignment: expect.objectContaining({
          loadId: 'l456',
          vehicleId: 'v123'
        })
      }));
    });

    it('should return 404 if no suitable vehicle found', async () => {
      req.params.loadId = 'l456';
      mockVehicleAssignmentService.assignVehicleToLoad.mockResolvedValue(null);

      await vehicleAssignmentController.assignVehicleToLoad(req, res);

      expect(mockVehicleAssignmentService.assignVehicleToLoad).toHaveBeenCalledWith('l456', {});
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({
          code: 'NO_SUITABLE_VEHICLE'
        })
      }));
    });

    it('should return 400 for invalid vehicle type', async () => {
      req.params.loadId = 'l456';
      req.body.criteria = {
        preferredVehicleType: 'INVALID_TYPE'
      };

      await vehicleAssignmentController.assignVehicleToLoad(req, res);

      expect(mockVehicleAssignmentService.assignVehicleToLoad).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({
          code: 'INVALID_VEHICLE_TYPE'
        })
      }));
    });

    it('should handle load already assigned error', async () => {
      req.params.loadId = 'l456';
      mockVehicleAssignmentService.assignVehicleToLoad.mockRejectedValue(
        new Error('Load l456 is already assigned to vehicle v789')
      );

      await vehicleAssignmentController.assignVehicleToLoad(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({
          code: 'LOAD_ALREADY_ASSIGNED'
        })
      }));
    });
  });

  describe('unassignVehicleFromLoad', () => {
    it('should unassign a vehicle from a load', async () => {
      req.params.loadId = 'l456';
      mockVehicleAssignmentService.unassignVehicleFromLoad.mockResolvedValue(true);

      await vehicleAssignmentController.unassignVehicleFromLoad(req, res);

      expect(mockVehicleAssignmentService.unassignVehicleFromLoad).toHaveBeenCalledWith('l456');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('unassigned from load'),
        loadId: 'l456'
      }));
    });

    it('should handle load not found error', async () => {
      req.params.loadId = 'l999';
      mockVehicleAssignmentService.unassignVehicleFromLoad.mockRejectedValue(
        new Error('Load with ID l999 not found')
      );

      await vehicleAssignmentController.unassignVehicleFromLoad(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({
          code: 'LOAD_NOT_FOUND'
        })
      }));
    });

    it('should handle load not assigned error', async () => {
      req.params.loadId = 'l456';
      mockVehicleAssignmentService.unassignVehicleFromLoad.mockRejectedValue(
        new Error('Load l456 is not assigned to any vehicle')
      );

      await vehicleAssignmentController.unassignVehicleFromLoad(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({
          code: 'LOAD_NOT_ASSIGNED'
        })
      }));
    });
  });

  describe('getLoadsForVehicle', () => {
    it('should get all loads assigned to a vehicle', async () => {
      req.params.vehicleId = 'v123';
      const mockLoads = [mockLoad];
      mockVehicleAssignmentService.getLoadsForVehicle.mockResolvedValue(mockLoads);

      await vehicleAssignmentController.getLoadsForVehicle(req, res);

      expect(mockVehicleAssignmentService.getLoadsForVehicle).toHaveBeenCalledWith('v123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ loads: mockLoads });
    });
  });

  describe('batchAssignVehicles', () => {
    it('should batch assign vehicles to loads', async () => {
      req.body.criteria = {
        prioritizeProximity: true
      };
      
      const batchResult = {
        successful: [{ loadId: 'l456', vehicleId: 'v123' }],
        failed: ['l789']
      };
      
      mockVehicleAssignmentService.batchAssignVehiclesToLoads.mockResolvedValue(batchResult);

      await vehicleAssignmentController.batchAssignVehicles(req, res);

      expect(mockVehicleAssignmentService.batchAssignVehiclesToLoads).toHaveBeenCalledWith(req.body.criteria);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Assigned 1 loads, failed to assign 1 loads'),
        result: batchResult
      }));
    });

    it('should return 400 for invalid vehicle type in criteria', async () => {
      req.body.criteria = {
        preferredVehicleType: 'INVALID_TYPE'
      };

      await vehicleAssignmentController.batchAssignVehicles(req, res);

      expect(mockVehicleAssignmentService.batchAssignVehiclesToLoads).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({
          code: 'INVALID_VEHICLE_TYPE'
        })
      }));
    });
  });

  describe('checkVehicleCapacityForLoad', () => {
    it('should check if a vehicle has sufficient capacity for a load', async () => {
      req.params.vehicleId = 'v123';
      req.params.loadId = 'l456';
      mockVehicleAssignmentService.checkVehicleCapacityForLoad.mockResolvedValue(true);

      await vehicleAssignmentController.checkVehicleCapacityForLoad(req, res);

      expect(mockVehicleAssignmentService.checkVehicleCapacityForLoad).toHaveBeenCalledWith('v123', 'l456');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        vehicleId: 'v123',
        loadId: 'l456',
        hasCapacity: true
      }));
    });
  });
});
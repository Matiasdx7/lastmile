import { Request, Response } from 'express';
import { VehicleController } from '../../controllers/VehicleController';
import { VehicleService } from '../../services/VehicleService';
import { Vehicle, VehicleStatus, VehicleType } from '../../../../shared/types';

// Mock the VehicleService
const mockVehicleService = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByStatus: jest.fn(),
  findByType: jest.fn(),
  findByLicensePlate: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  updateStatus: jest.fn(),
  updateLocation: jest.fn(),
  findAvailableVehiclesInArea: jest.fn()
} as unknown as jest.Mocked<VehicleService>;

// Create a mock vehicle
const mockVehicle: Vehicle = {
  id: '123',
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
  res.send = jest.fn().mockReturnThis();
  return res;
};

describe('VehicleController', () => {
  let vehicleController: VehicleController;
  let req: Request;
  let res: Response;

  beforeEach(() => {
    vehicleController = new VehicleController(mockVehicleService);
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe('getAllVehicles', () => {
    it('should return all vehicles', async () => {
      const vehicles = [mockVehicle];
      mockVehicleService.findAll.mockResolvedValue(vehicles);

      await vehicleController.getAllVehicles(req, res);

      expect(mockVehicleService.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ vehicles });
    });

    it('should filter vehicles by status', async () => {
      const vehicles = [mockVehicle];
      req.query.status = VehicleStatus.AVAILABLE;
      mockVehicleService.findByStatus.mockResolvedValue(vehicles);

      await vehicleController.getAllVehicles(req, res);

      expect(mockVehicleService.findByStatus).toHaveBeenCalledWith(VehicleStatus.AVAILABLE);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ vehicles });
    });

    it('should filter vehicles by type', async () => {
      const vehicles = [mockVehicle];
      req.query.type = VehicleType.VAN;
      mockVehicleService.findByType.mockResolvedValue(vehicles);

      await vehicleController.getAllVehicles(req, res);

      expect(mockVehicleService.findByType).toHaveBeenCalledWith(VehicleType.VAN);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ vehicles });
    });

    it('should handle errors', async () => {
      mockVehicleService.findAll.mockRejectedValue(new Error('Database error'));

      await vehicleController.getAllVehicles(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({
          code: 'INTERNAL_SERVER_ERROR'
        })
      }));
    });
  });

  describe('getVehicleById', () => {
    it('should return a vehicle by ID', async () => {
      req.params.id = '123';
      mockVehicleService.findById.mockResolvedValue(mockVehicle);

      await vehicleController.getVehicleById(req, res);

      expect(mockVehicleService.findById).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ vehicle: mockVehicle });
    });

    it('should return 404 if vehicle not found', async () => {
      req.params.id = '456';
      mockVehicleService.findById.mockResolvedValue(null);

      await vehicleController.getVehicleById(req, res);

      expect(mockVehicleService.findById).toHaveBeenCalledWith('456');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({
          code: 'VEHICLE_NOT_FOUND'
        })
      }));
    });
  });

  describe('createVehicle', () => {
    it('should create a new vehicle', async () => {
      const vehicleData = {
        licensePlate: 'XYZ789',
        type: VehicleType.TRUCK,
        capacity: {
          maxWeight: 2000,
          maxVolume: 20,
          maxPackages: 100
        },
        status: VehicleStatus.AVAILABLE
      };
      
      req.body = vehicleData;
      mockVehicleService.findByLicensePlate.mockResolvedValue(null);
      mockVehicleService.create.mockResolvedValue({ ...vehicleData, id: '789', createdAt: new Date(), updatedAt: new Date() } as Vehicle);

      await vehicleController.createVehicle(req, res);

      expect(mockVehicleService.findByLicensePlate).toHaveBeenCalledWith('XYZ789');
      expect(mockVehicleService.create).toHaveBeenCalledWith(vehicleData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        vehicle: expect.objectContaining({
          id: '789',
          licensePlate: 'XYZ789'
        })
      }));
    });

    it('should return 409 if license plate already exists', async () => {
      req.body = {
        licensePlate: 'ABC123',
        type: VehicleType.VAN,
        capacity: {
          maxWeight: 1000,
          maxVolume: 10,
          maxPackages: 50
        }
      };
      
      mockVehicleService.findByLicensePlate.mockResolvedValue(mockVehicle);

      await vehicleController.createVehicle(req, res);

      expect(mockVehicleService.findByLicensePlate).toHaveBeenCalledWith('ABC123');
      expect(mockVehicleService.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({
          code: 'LICENSE_PLATE_EXISTS'
        })
      }));
    });
  });

  describe('updateVehicle', () => {
    it('should update an existing vehicle', async () => {
      req.params.id = '123';
      req.body = {
        capacity: {
          maxWeight: 1500,
          maxVolume: 15,
          maxPackages: 75
        }
      };
      
      mockVehicleService.findById.mockResolvedValue(mockVehicle);
      mockVehicleService.update.mockResolvedValue({
        ...mockVehicle,
        capacity: {
          maxWeight: 1500,
          maxVolume: 15,
          maxPackages: 75
        }
      });

      await vehicleController.updateVehicle(req, res);

      expect(mockVehicleService.findById).toHaveBeenCalledWith('123');
      expect(mockVehicleService.update).toHaveBeenCalledWith('123', req.body);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if vehicle not found', async () => {
      req.params.id = '456';
      req.body = { status: VehicleStatus.MAINTENANCE };
      
      mockVehicleService.findById.mockResolvedValue(null);

      await vehicleController.updateVehicle(req, res);

      expect(mockVehicleService.findById).toHaveBeenCalledWith('456');
      expect(mockVehicleService.update).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateVehicleStatus', () => {
    it('should update vehicle status', async () => {
      req.params.id = '123';
      req.body = { status: VehicleStatus.MAINTENANCE };
      
      mockVehicleService.updateStatus.mockResolvedValue({
        ...mockVehicle,
        status: VehicleStatus.MAINTENANCE
      });

      await vehicleController.updateVehicleStatus(req, res);

      expect(mockVehicleService.updateStatus).toHaveBeenCalledWith('123', VehicleStatus.MAINTENANCE);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 for invalid status', async () => {
      req.params.id = '123';
      req.body = { status: 'INVALID_STATUS' };

      await vehicleController.updateVehicleStatus(req, res);

      expect(mockVehicleService.updateStatus).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateVehicleLocation', () => {
    it('should update vehicle location', async () => {
      req.params.id = '123';
      req.body = { latitude: 40.7128, longitude: -74.0060 };
      
      mockVehicleService.updateLocation.mockResolvedValue({
        ...mockVehicle,
        currentLocation: { latitude: 40.7128, longitude: -74.0060 }
      });

      await vehicleController.updateVehicleLocation(req, res);

      expect(mockVehicleService.updateLocation).toHaveBeenCalledWith('123', 40.7128, -74.0060);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 for invalid location data', async () => {
      req.params.id = '123';
      req.body = { latitude: 'invalid', longitude: -74.0060 };

      await vehicleController.updateVehicleLocation(req, res);

      expect(mockVehicleService.updateLocation).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getVehicleCapacity', () => {
    it('should return vehicle capacity', async () => {
      req.params.id = '123';
      mockVehicleService.findById.mockResolvedValue(mockVehicle);

      await vehicleController.getVehicleCapacity(req, res);

      expect(mockVehicleService.findById).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ capacity: mockVehicle.capacity });
    });
  });

  describe('findAvailableVehiclesInArea', () => {
    it('should find available vehicles in an area', async () => {
      req.query = { latitude: '40.7128', longitude: '-74.0060', radiusKm: '10' };
      mockVehicleService.findAvailableVehiclesInArea.mockResolvedValue([mockVehicle]);

      await vehicleController.findAvailableVehiclesInArea(req, res);

      expect(mockVehicleService.findAvailableVehiclesInArea).toHaveBeenCalledWith(40.7128, -74.0060, 10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ vehicles: [mockVehicle] });
    });

    it('should return 400 for missing coordinates', async () => {
      req.query = { latitude: '40.7128' };

      await vehicleController.findAvailableVehiclesInArea(req, res);

      expect(mockVehicleService.findAvailableVehiclesInArea).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
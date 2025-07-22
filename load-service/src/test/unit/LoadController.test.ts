import { LoadController } from '../../controllers/LoadController';
import { LoadConsolidationService } from '../../services/LoadConsolidationService';
import { Request, Response } from 'express';
import { Pool } from 'pg';
import { Load, LoadStatus, Order, OrderStatus } from '../../../../shared/types';

// Mock dependencies
jest.mock('../../services/LoadConsolidationService');
jest.mock('../../../../shared/database/repositories/OrderRepository');
jest.mock('../../../../shared/database/repositories/LoadRepository');
jest.mock('pg');

describe('LoadController', () => {
  let loadController: LoadController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockPool: jest.Mocked<Pool>;
  
  const mockLoad: Load = {
    id: 'load1',
    orders: ['order1', 'order2'],
    totalWeight: 15,
    totalVolume: 0.03,
    status: 'consolidated' as LoadStatus,
    createdAt: new Date('2023-01-01T12:00:00Z'),
    updatedAt: new Date('2023-01-01T12:00:00Z')
  };
  
  beforeEach(() => {
    mockPool = new Pool() as jest.Mocked<Pool>;
    loadController = new LoadController(mockPool);
    
    // Mock request and response
    mockReq = {
      params: {},
      query: {},
      body: {},
      app: {
        locals: {
          dbPool: mockPool
        }
      } as any // Type assertion to bypass Express Application type checking
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Mock LoadConsolidationService methods
    (LoadConsolidationService.prototype.groupOrdersByGeographicArea as jest.Mock).mockResolvedValue([mockLoad]);
    (LoadConsolidationService.prototype.addOrderToLoad as jest.Mock).mockResolvedValue(mockLoad);
    (LoadConsolidationService.prototype.removeOrderFromLoad as jest.Mock).mockResolvedValue(mockLoad);
    (LoadConsolidationService.prototype.detectDeliveryConflicts as jest.Mock).mockResolvedValue([]);
    (LoadConsolidationService.prototype.canAddOrderToLoad as jest.Mock).mockResolvedValue(true);
  });
  
  describe('createLoadsByGeographicArea', () => {
    it('should create loads successfully', async () => {
      mockReq.body = {
        latitude: 37.7749,
        longitude: -122.4194,
        maxDistanceKm: 10
      };
      
      await loadController.createLoadsByGeographicArea(mockReq as Request, mockRes as Response);
      
      expect(LoadConsolidationService.prototype.groupOrdersByGeographicArea).toHaveBeenCalledWith(
        37.7749,
        -122.4194,
        { maxDistanceKm: 10 }
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Created 1 load(s)',
        loads: [mockLoad]
      }));
    });
    
    it('should return 400 for invalid input', async () => {
      mockReq.body = {
        longitude: -122.4194 // Missing latitude
      };
      
      await loadController.createLoadsByGeographicArea(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String)
      }));
    });
    
    it('should handle errors', async () => {
      mockReq.body = {
        latitude: 37.7749,
        longitude: -122.4194
      };
      
      (LoadConsolidationService.prototype.groupOrdersByGeographicArea as jest.Mock).mockRejectedValue(new Error('Test error'));
      
      await loadController.createLoadsByGeographicArea(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Failed to create loads'
      }));
    });
  });
  
  describe('addOrderToLoad', () => {
    it('should add order to load successfully', async () => {
      mockReq.params = { id: 'load1' };
      mockReq.body = { orderId: 'order3' };
      
      await loadController.addOrderToLoad(mockReq as Request, mockRes as Response);
      
      expect(LoadConsolidationService.prototype.addOrderToLoad).toHaveBeenCalledWith('load1', 'order3');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Order added to load successfully',
        load: mockLoad
      }));
    });
    
    it('should return 400 when order cannot be added', async () => {
      mockReq.params = { id: 'load1' };
      mockReq.body = { orderId: 'order3' };
      
      (LoadConsolidationService.prototype.addOrderToLoad as jest.Mock).mockResolvedValue(null);
      
      await loadController.addOrderToLoad(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('Failed to add order')
      }));
    });
    
    it('should return 400 for invalid input', async () => {
      mockReq.params = { id: 'load1' };
      mockReq.body = {}; // Missing orderId
      
      await loadController.addOrderToLoad(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String)
      }));
    });
  });
  
  describe('removeOrderFromLoad', () => {
    it('should remove order from load successfully', async () => {
      mockReq.params = { id: 'load1', orderId: 'order1' };
      
      await loadController.removeOrderFromLoad(mockReq as Request, mockRes as Response);
      
      expect(LoadConsolidationService.prototype.removeOrderFromLoad).toHaveBeenCalledWith('load1', 'order1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Order removed from load successfully',
        load: mockLoad
      }));
    });
    
    it('should return 400 when order cannot be removed', async () => {
      mockReq.params = { id: 'load1', orderId: 'nonexistent' };
      
      (LoadConsolidationService.prototype.removeOrderFromLoad as jest.Mock).mockResolvedValue(null);
      
      await loadController.removeOrderFromLoad(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('Failed to remove order')
      }));
    });
  });
  
  describe('detectDeliveryConflicts', () => {
    it('should detect conflicts successfully', async () => {
      mockReq.params = { id: 'load1' };
      
      const mockConflicts = ['Time window conflict between orders'];
      (LoadConsolidationService.prototype.detectDeliveryConflicts as jest.Mock).mockResolvedValue(mockConflicts);
      
      await loadController.detectDeliveryConflicts(mockReq as Request, mockRes as Response);
      
      expect(LoadConsolidationService.prototype.detectDeliveryConflicts).toHaveBeenCalledWith('load1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        loadId: 'load1',
        conflicts: mockConflicts,
        hasConflicts: true
      }));
    });
    
    it('should return empty conflicts when none exist', async () => {
      mockReq.params = { id: 'load1' };
      
      await loadController.detectDeliveryConflicts(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        loadId: 'load1',
        conflicts: [],
        hasConflicts: false
      }));
    });
  });
  
  describe('checkOrderCompatibility', () => {
    it('should check compatibility successfully', async () => {
      mockReq.params = { id: 'load1' };
      mockReq.body = { orderId: 'order3' };
      
      await loadController.checkOrderCompatibility(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        loadId: 'load1',
        orderId: 'order3',
        isCompatible: true
      }));
    });
    
    it('should return incompatible when order cannot be added', async () => {
      mockReq.params = { id: 'load1' };
      mockReq.body = { orderId: 'order3' };
      
      (LoadConsolidationService.prototype.canAddOrderToLoad as jest.Mock).mockResolvedValue(false);
      
      await loadController.checkOrderCompatibility(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        isCompatible: false
      }));
    });
    
    it('should return 400 for invalid input', async () => {
      mockReq.params = { id: 'load1' };
      mockReq.body = {}; // Missing orderId
      
      await loadController.checkOrderCompatibility(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String)
      }));
    });
  });
});
import { LoadConsolidationService } from '../../services/LoadConsolidationService';
import { OrderRepository } from '../../../../shared/database/repositories/OrderRepository';
import { LoadRepository } from '../../../../shared/database/repositories/LoadRepository';
import { Order, Load, LoadStatus, OrderStatus } from '../../../../shared/types';

// Mock repositories
jest.mock('../../../../shared/database/repositories/OrderRepository');
jest.mock('../../../../shared/database/repositories/LoadRepository');

describe('LoadConsolidationService', () => {
  let loadConsolidationService: LoadConsolidationService;
  let mockOrderRepository: jest.Mocked<OrderRepository>;
  let mockLoadRepository: jest.Mocked<LoadRepository>;
  
  const mockOrders: Order[] = [
    {
      id: 'order1',
      customerId: 'customer1',
      customerName: 'John Doe',
      customerPhone: '123-456-7890',
      deliveryAddress: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        coordinates: { latitude: 37.7749, longitude: -122.4194 }
      },
      packageDetails: [
        {
          id: 'pkg1',
          description: 'Small package',
          weight: 5,
          dimensions: { length: 20, width: 15, height: 10 },
          fragile: false
        }
      ],
      status: 'pending' as OrderStatus,
      createdAt: new Date('2023-01-01T10:00:00Z'),
      updatedAt: new Date('2023-01-01T10:00:00Z')
    },
    {
      id: 'order2',
      customerId: 'customer2',
      customerName: 'Jane Smith',
      customerPhone: '987-654-3210',
      deliveryAddress: {
        street: '456 Oak St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        coordinates: { latitude: 37.7750, longitude: -122.4195 }
      },
      packageDetails: [
        {
          id: 'pkg2',
          description: 'Medium package',
          weight: 10,
          dimensions: { length: 30, width: 25, height: 20 },
          fragile: false
        }
      ],
      timeWindow: {
        startTime: new Date('2023-01-01T13:00:00Z'),
        endTime: new Date('2023-01-01T15:00:00Z')
      },
      status: 'pending' as OrderStatus,
      createdAt: new Date('2023-01-01T10:30:00Z'),
      updatedAt: new Date('2023-01-01T10:30:00Z')
    },
    {
      id: 'order3',
      customerId: 'customer3',
      customerName: 'Bob Johnson',
      customerPhone: '555-123-4567',
      deliveryAddress: {
        street: '789 Pine St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        coordinates: { latitude: 37.7751, longitude: -122.4196 }
      },
      packageDetails: [
        {
          id: 'pkg3',
          description: 'Large package',
          weight: 20,
          dimensions: { length: 50, width: 40, height: 30 },
          fragile: true
        }
      ],
      timeWindow: {
        startTime: new Date('2023-01-01T14:00:00Z'),
        endTime: new Date('2023-01-01T16:00:00Z')
      },
      status: 'pending' as OrderStatus,
      createdAt: new Date('2023-01-01T11:00:00Z'),
      updatedAt: new Date('2023-01-01T11:00:00Z')
    },
    {
      id: 'order4',
      customerId: 'customer4',
      customerName: 'Alice Brown',
      customerPhone: '555-987-6543',
      deliveryAddress: {
        street: '101 Maple St',
        city: 'Othertown',
        state: 'CA',
        zipCode: '54321',
        coordinates: { latitude: 38.5816, longitude: -121.4944 }
      },
      packageDetails: [
        {
          id: 'pkg4',
          description: 'Heavy package',
          weight: 30,
          dimensions: { length: 40, width: 30, height: 25 },
          fragile: false
        }
      ],
      timeWindow: {
        startTime: new Date('2023-01-01T09:00:00Z'),
        endTime: new Date('2023-01-01T11:00:00Z')
      },
      status: 'pending' as OrderStatus,
      createdAt: new Date('2023-01-01T08:00:00Z'),
      updatedAt: new Date('2023-01-01T08:00:00Z')
    }
  ];
  
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
    mockOrderRepository = new OrderRepository(null as any) as jest.Mocked<OrderRepository>;
    mockLoadRepository = new LoadRepository(null as any) as jest.Mocked<LoadRepository>;
    
    loadConsolidationService = new LoadConsolidationService(
      mockOrderRepository,
      mockLoadRepository,
      {
        maxDistanceKm: 10,
        maxWeightKg: 50,
        maxVolumeM3: 0.1,
        maxTimeWindowOverlapMinutes: 60
      }
    );
    
    // Setup mock implementations
    mockOrderRepository.findPendingOrdersInArea = jest.fn().mockResolvedValue(mockOrders.slice(0, 3));
    mockOrderRepository.findById = jest.fn().mockImplementation((id: string) => {
      const order = mockOrders.find(o => o.id === id);
      return Promise.resolve(order || null);
    });
    mockOrderRepository.updateStatus = jest.fn().mockResolvedValue(mockOrders[0]);
    
    mockLoadRepository.create = jest.fn().mockImplementation((load: any) => {
      return Promise.resolve({
        ...load,
        id: 'newload',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
    mockLoadRepository.findById = jest.fn().mockResolvedValue(mockLoad);
    mockLoadRepository.update = jest.fn().mockImplementation((id: string, data: any) => {
      return Promise.resolve({
        ...mockLoad,
        ...data,
        id,
        updatedAt: new Date()
      });
    });
  });
  
  describe('groupOrdersByGeographicArea', () => {
    it('should group orders by geographic area', async () => {
      const loads = await loadConsolidationService.groupOrdersByGeographicArea(37.7749, -122.4194);
      
      expect(mockOrderRepository.findPendingOrdersInArea).toHaveBeenCalledWith(37.7749, -122.4194, 10);
      expect(mockLoadRepository.create).toHaveBeenCalled();
      expect(mockOrderRepository.updateStatus).toHaveBeenCalledTimes(3);
      expect(loads.length).toBeGreaterThan(0);
    });
    
    it('should return empty array when no orders found', async () => {
      mockOrderRepository.findPendingOrdersInArea = jest.fn().mockResolvedValue([]);
      
      const loads = await loadConsolidationService.groupOrdersByGeographicArea(37.7749, -122.4194);
      
      expect(loads).toEqual([]);
      expect(mockLoadRepository.create).not.toHaveBeenCalled();
    });
    
    it('should create multiple loads when capacity is exceeded', async () => {
      // Mock a large order that would exceed capacity
      const largeOrder = {
        ...mockOrders[0],
        id: 'largeOrder',
        packageDetails: [{
          id: 'largePkg',
          description: 'Very large package',
          weight: 40,
          dimensions: { length: 100, width: 100, height: 100 },
          fragile: false
        }]
      };
      
      mockOrderRepository.findPendingOrdersInArea = jest.fn().mockResolvedValue([
        mockOrders[0],
        largeOrder,
        mockOrders[1]
      ]);
      
      const loads = await loadConsolidationService.groupOrdersByGeographicArea(37.7749, -122.4194);
      
      expect(loads.length).toBeGreaterThan(1);
      expect(mockLoadRepository.create).toHaveBeenCalledTimes(loads.length);
    });
    
    it('should separate orders with incompatible time windows', async () => {
      // Orders with non-overlapping time windows
      const earlyOrder = {
        ...mockOrders[0],
        id: 'earlyOrder',
        timeWindow: {
          startTime: new Date('2023-01-01T08:00:00Z'),
          endTime: new Date('2023-01-01T10:00:00Z')
        }
      };
      
      const lateOrder = {
        ...mockOrders[1],
        id: 'lateOrder',
        timeWindow: {
          startTime: new Date('2023-01-01T18:00:00Z'),
          endTime: new Date('2023-01-01T20:00:00Z')
        }
      };
      
      mockOrderRepository.findPendingOrdersInArea = jest.fn().mockResolvedValue([
        earlyOrder,
        lateOrder
      ]);
      
      const loads = await loadConsolidationService.groupOrdersByGeographicArea(37.7749, -122.4194);
      
      expect(loads.length).toBe(2);
    });
  });
  
  describe('canAddOrderToLoad', () => {
    it('should return true when order can be added to load', async () => {
      const result = await loadConsolidationService.canAddOrderToLoad(mockLoad, mockOrders[2]);
      
      expect(result).toBe(true);
    });
    
    it('should return false when weight capacity would be exceeded', async () => {
      const heavyOrder = {
        ...mockOrders[0],
        packageDetails: [{
          id: 'heavyPkg',
          description: 'Very heavy package',
          weight: 40,
          dimensions: { length: 20, width: 15, height: 10 },
          fragile: false
        }]
      };
      
      const result = await loadConsolidationService.canAddOrderToLoad(mockLoad, heavyOrder);
      
      expect(result).toBe(false);
    });
    
    it('should return false when time windows are incompatible', async () => {
      const incompatibleOrder = {
        ...mockOrders[3], // Order with non-overlapping time window
      };
      
      mockOrderRepository.findById = jest.fn().mockImplementation((id: string) => {
        if (id === 'order1' || id === 'order2') {
          return Promise.resolve(mockOrders[1]); // Order with time window 13:00-15:00
        }
        return Promise.resolve(null);
      });
      
      const result = await loadConsolidationService.canAddOrderToLoad(mockLoad, incompatibleOrder);
      
      expect(result).toBe(false);
    });
  });
  
  describe('addOrderToLoad', () => {
    it('should add order to load when constraints allow', async () => {
      mockLoadRepository.findById = jest.fn().mockResolvedValue(mockLoad);
      mockOrderRepository.findById = jest.fn().mockResolvedValue(mockOrders[2]);
      
      const result = await loadConsolidationService.addOrderToLoad('load1', 'order3');
      
      expect(result).not.toBeNull();
      expect(mockLoadRepository.update).toHaveBeenCalled();
      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith('order3', 'consolidated');
    });
    
    it('should return null when load or order not found', async () => {
      mockLoadRepository.findById = jest.fn().mockResolvedValue(null);
      
      const result = await loadConsolidationService.addOrderToLoad('nonexistent', 'order1');
      
      expect(result).toBeNull();
      expect(mockLoadRepository.update).not.toHaveBeenCalled();
    });
    
    it('should return null when order cannot be added to load', async () => {
      // Mock canAddOrderToLoad to return false
      jest.spyOn(loadConsolidationService, 'canAddOrderToLoad').mockResolvedValue(false);
      
      const result = await loadConsolidationService.addOrderToLoad('load1', 'order3');
      
      expect(result).toBeNull();
      expect(mockLoadRepository.update).not.toHaveBeenCalled();
    });
  });
  
  describe('removeOrderFromLoad', () => {
    it('should remove order from load', async () => {
      const result = await loadConsolidationService.removeOrderFromLoad('load1', 'order1');
      
      expect(result).not.toBeNull();
      expect(mockLoadRepository.update).toHaveBeenCalled();
      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith('order1', 'pending');
    });
    
    it('should return null when load or order not found', async () => {
      mockLoadRepository.findById = jest.fn().mockResolvedValue(null);
      
      const result = await loadConsolidationService.removeOrderFromLoad('nonexistent', 'order1');
      
      expect(result).toBeNull();
      expect(mockLoadRepository.update).not.toHaveBeenCalled();
    });
    
    it('should return null when order is not in the load', async () => {
      const result = await loadConsolidationService.removeOrderFromLoad('load1', 'nonexistent');
      
      expect(result).toBeNull();
      expect(mockLoadRepository.update).not.toHaveBeenCalled();
    });
  });
  
  describe('detectDeliveryConflicts', () => {
    it('should detect time window conflicts', async () => {
      // Setup orders with conflicting time windows
      mockLoadRepository.findById = jest.fn().mockResolvedValue({
        ...mockLoad,
        orders: ['order2', 'order4'] // Orders with non-overlapping time windows
      });
      
      const conflicts = await loadConsolidationService.detectDeliveryConflicts('load1');
      
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0]).toContain('Time window conflict');
    });
    
    it('should detect special instructions', async () => {
      // Add special instructions to an order
      const orderWithInstructions = {
        ...mockOrders[0],
        specialInstructions: 'Handle with care'
      };
      
      mockLoadRepository.findById = jest.fn().mockResolvedValue({
        ...mockLoad,
        orders: ['specialOrder']
      });
      
      mockOrderRepository.findById = jest.fn().mockResolvedValue(orderWithInstructions);
      
      const conflicts = await loadConsolidationService.detectDeliveryConflicts('load1');
      
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0]).toContain('special instructions');
    });
    
    it('should detect fragile items', async () => {
      // Order with fragile item
      mockLoadRepository.findById = jest.fn().mockResolvedValue({
        ...mockLoad,
        orders: ['order3'] // Order with fragile package
      });
      
      const conflicts = await loadConsolidationService.detectDeliveryConflicts('load1');
      
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0]).toContain('fragile');
    });
    
    it('should return empty array when no conflicts found', async () => {
      // Setup compatible orders
      mockLoadRepository.findById = jest.fn().mockResolvedValue({
        ...mockLoad,
        orders: ['order1'] // Order with no time window or special requirements
      });
      
      const conflicts = await loadConsolidationService.detectDeliveryConflicts('load1');
      
      expect(conflicts.length).toBe(0);
    });
  });
});
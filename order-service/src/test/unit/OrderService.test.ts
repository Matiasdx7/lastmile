import { OrderService } from '../../services/OrderService';
import { MockOrderRepository } from '../../test-repositories';
import { OrderStatus } from '../../../../shared/types/enums/OrderStatus';
import { NotFoundError, ApiError } from '../../middleware/errorHandler';
import '@types/jest';

describe('OrderService', () => {
  let orderService: OrderService;
  let mockOrderRepository: MockOrderRepository;

  beforeEach(() => {
    mockOrderRepository = new MockOrderRepository();
    orderService = new OrderService(mockOrderRepository as any);
  });

  // Valid order data for testing
  const validOrderData = {
    customerId: 'customer123',
    customerName: 'John Doe',
    customerPhone: '+1234567890',
    deliveryAddress: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      coordinates: {
        latitude: 37.7749,
        longitude: -122.4194
      }
    },
    packageDetails: [
      {
        id: '', // Adding empty ID that will be replaced by the service
        description: 'Test Package',
        weight: 10,
        dimensions: {
          length: 20,
          width: 15,
          height: 10
        },
        fragile: false
      }
    ],
    specialInstructions: 'Leave at the door'
  };

  describe('createOrder', () => {
    it('should create a new order with pending status', async () => {
      const order = await orderService.createOrder(validOrderData);

      expect(order).toBeDefined();
      expect(order.id).toBeDefined();
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.createdAt).toBeDefined();
      expect(order.updatedAt).toBeDefined();
    });

    it('should assign IDs to packages if not provided', async () => {
      const orderWithoutPackageIds = {
        ...validOrderData,
        packageDetails: [
          {
            id: '', // Adding empty ID that will be replaced
            description: 'Test Package',
            weight: 10,
            dimensions: {
              length: 20,
              width: 15,
              height: 10
            },
            fragile: false
          }
        ]
      };

      const order = await orderService.createOrder(orderWithoutPackageIds);
      expect(order.packageDetails[0].id).toBeDefined();
    });
  });

  describe('getOrderById', () => {
    it('should return an order by ID', async () => {
      // Create a spy on the findById method
      const findByIdSpy = jest.spyOn(mockOrderRepository, 'findById');

      // Mock the return value for a specific ID
      const mockOrder = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...validOrderData,
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      findByIdSpy.mockResolvedValueOnce(mockOrder);

      const order = await orderService.getOrderById('123e4567-e89b-12d3-a456-426614174000');

      expect(order).toEqual(mockOrder);
      expect(findByIdSpy).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should throw NotFoundError for non-existent order', async () => {
      // Create a spy on the findById method
      const findByIdSpy = jest.spyOn(mockOrderRepository, 'findById');

      // Mock the return value for a non-existent ID
      findByIdSpy.mockResolvedValueOnce(null);

      await expect(orderService.getOrderById('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getAllOrders', () => {
    it('should return all orders with default pagination', async () => {
      const findAllSpy = jest.spyOn(mockOrderRepository, 'findAll');

      await orderService.getAllOrders();

      expect(findAllSpy).toHaveBeenCalledWith(100, 0);
    });

    it('should return orders with custom pagination', async () => {
      const findAllSpy = jest.spyOn(mockOrderRepository, 'findAll');

      await orderService.getAllOrders(20, 10);

      expect(findAllSpy).toHaveBeenCalledWith(20, 10);
    });
  });

  describe('updateOrder', () => {
    it('should update an existing order', async () => {
      // Create spies on the repository methods
      const findByIdSpy = jest.spyOn(mockOrderRepository, 'findById');
      const updateSpy = jest.spyOn(mockOrderRepository, 'update');

      // Mock the return values
      const existingOrder = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...validOrderData,
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      findByIdSpy.mockResolvedValueOnce(existingOrder);

      const updatedOrder = {
        ...existingOrder,
        customerName: 'Jane Doe',
        updatedAt: new Date()
      };
      updateSpy.mockResolvedValueOnce(updatedOrder);

      const result = await orderService.updateOrder('123e4567-e89b-12d3-a456-426614174000', { customerName: 'Jane Doe' });

      expect(result).toEqual(updatedOrder);
      expect(findByIdSpy).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(updateSpy).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', { customerName: 'Jane Doe' });
    });

    it('should throw NotFoundError for non-existent order', async () => {
      const findByIdSpy = jest.spyOn(mockOrderRepository, 'findById');
      findByIdSpy.mockResolvedValueOnce(null);

      await expect(orderService.updateOrder('non-existent-id', { customerName: 'Jane Doe' })).rejects.toThrow(NotFoundError);
    });

    it('should assign IDs to packages if not provided in update', async () => {
      // Create spies on the repository methods
      const findByIdSpy = jest.spyOn(mockOrderRepository, 'findById');
      const updateSpy = jest.spyOn(mockOrderRepository, 'update');

      // Mock the return values
      const existingOrder = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...validOrderData,
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      findByIdSpy.mockResolvedValueOnce(existingOrder);

      const updatedOrder = {
        ...existingOrder,
        packageDetails: [
          {
            id: 'new-package-id',
            description: 'New Package',
            weight: 5,
            dimensions: {
              length: 10,
              width: 10,
              height: 5
            },
            fragile: true
          }
        ],
        updatedAt: new Date()
      };
      updateSpy.mockResolvedValueOnce(updatedOrder);

      const updateData = {
        packageDetails: [
          {
            id: '', // Adding empty ID that will be replaced by the service
            description: 'New Package',
            weight: 5,
            dimensions: {
              length: 10,
              width: 10,
              height: 5
            },
            fragile: true
          }
        ]
      };

      await orderService.updateOrder('123e4567-e89b-12d3-a456-426614174000', updateData);

      // Check that the update was called with package IDs assigned
      const updateCall = updateSpy.mock.calls[0][1];
      expect(updateCall.packageDetails).toBeDefined();
      expect(updateCall.packageDetails![0].id).toBeDefined();
    });
  });

  describe('deleteOrder', () => {
    it('should delete an existing order', async () => {
      const findByIdSpy = jest.spyOn(mockOrderRepository, 'findById');
      const deleteSpy = jest.spyOn(mockOrderRepository, 'delete');

      const existingOrder = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...validOrderData,
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      findByIdSpy.mockResolvedValueOnce(existingOrder);
      deleteSpy.mockResolvedValueOnce(true);

      const result = await orderService.deleteOrder('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toBe(true);
      expect(findByIdSpy).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(deleteSpy).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should throw NotFoundError for non-existent order', async () => {
      const findByIdSpy = jest.spyOn(mockOrderRepository, 'findById');
      findByIdSpy.mockResolvedValueOnce(null);

      await expect(orderService.deleteOrder('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getOrdersByStatus', () => {
    it('should return orders filtered by status', async () => {
      const findByStatusSpy = jest.spyOn(mockOrderRepository, 'findByStatus');

      await orderService.getOrdersByStatus(OrderStatus.PENDING);

      expect(findByStatusSpy).toHaveBeenCalledWith(OrderStatus.PENDING);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const findByIdSpy = jest.spyOn(mockOrderRepository, 'findById');
      const updateStatusSpy = jest.spyOn(mockOrderRepository, 'updateStatus');

      const existingOrder = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...validOrderData,
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      findByIdSpy.mockResolvedValueOnce(existingOrder);

      const updatedOrder = {
        ...existingOrder,
        status: OrderStatus.CONSOLIDATED,
        updatedAt: new Date()
      };
      updateStatusSpy.mockResolvedValueOnce(updatedOrder);

      const result = await orderService.updateOrderStatus('123e4567-e89b-12d3-a456-426614174000', OrderStatus.CONSOLIDATED);

      expect(result).toEqual(updatedOrder);
      expect(findByIdSpy).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(updateStatusSpy).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', OrderStatus.CONSOLIDATED);
    });

    it('should throw NotFoundError for non-existent order', async () => {
      const findByIdSpy = jest.spyOn(mockOrderRepository, 'findById');
      findByIdSpy.mockResolvedValueOnce(null);

      await expect(orderService.updateOrderStatus('non-existent-id', OrderStatus.CONSOLIDATED)).rejects.toThrow(NotFoundError);
    });

    it('should throw ApiError for invalid status transition', async () => {
      const findByIdSpy = jest.spyOn(mockOrderRepository, 'findById');

      const existingOrder = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...validOrderData,
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      findByIdSpy.mockResolvedValueOnce(existingOrder);

      // Try to update from PENDING to IN_TRANSIT (invalid transition)
      await expect(orderService.updateOrderStatus('123e4567-e89b-12d3-a456-426614174000', OrderStatus.IN_TRANSIT)).rejects.toThrow(ApiError);
    });
  });
});
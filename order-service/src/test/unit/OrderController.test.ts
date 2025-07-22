import { OrderController } from '../../controllers/OrderController';
import { OrderService } from '../../services/OrderService';
import { OrderStatus } from '../../../../shared/types/enums/OrderStatus';
import { NotFoundError, ApiError } from '../../middleware/errorHandler';
import '@types/jest';

// Mock the OrderService
jest.mock('../../services/OrderService');

describe('OrderController', () => {
    let orderController: OrderController;
    let mockOrderService: jest.Mocked<OrderService>;
    let mockRequest: any;
    let mockResponse: any;
    let mockNext: jest.Mock;

    beforeEach(() => {
        // Create a fresh mock for each test
        mockOrderService = new OrderService({} as any) as jest.Mocked<OrderService>;
        orderController = new OrderController(mockOrderService);

        // Mock Express request, response, and next
        mockRequest = {
            body: {},
            params: {},
            query: {}
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        mockNext = jest.fn();
    });

    // Valid order data for testing
    const validOrderData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
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
                id: 'pkg123',
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
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    describe('createOrder', () => {
        it('should create a new order and return 201 status', async () => {
            // Setup
            mockRequest.body = {
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

            mockOrderService.createOrder = jest.fn().mockResolvedValue(validOrderData);

            // Execute
            await orderController.createOrder(mockRequest, mockResponse, mockNext);

            // Assert
            expect(mockOrderService.createOrder).toHaveBeenCalledWith(mockRequest.body);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Order created successfully',
                    data: validOrderData
                })
            );
        });

        it('should pass errors to next middleware', async () => {
            // Setup
            const error = new Error('Test error');
            mockOrderService.createOrder = jest.fn().mockRejectedValue(error);

            // Execute
            await orderController.createOrder(mockRequest, mockResponse, mockNext);

            // Assert
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe('getAllOrders', () => {
        it('should return all orders with default pagination', async () => {
            // Setup
            mockOrderService.getAllOrders = jest.fn().mockResolvedValue([validOrderData]);

            // Execute
            await orderController.getAllOrders(mockRequest, mockResponse, mockNext);

            // Assert
            expect(mockOrderService.getAllOrders).toHaveBeenCalledWith(100, 0);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Orders retrieved successfully',
                    data: [validOrderData],
                    pagination: {
                        limit: 100,
                        offset: 0,
                        count: 1
                    }
                })
            );
        });

        it('should return orders with custom pagination', async () => {
            // Setup
            mockRequest.query = { limit: '20', offset: '10' };
            mockOrderService.getAllOrders = jest.fn().mockResolvedValue([validOrderData]);

            // Execute
            await orderController.getAllOrders(mockRequest, mockResponse, mockNext);

            // Assert
            expect(mockOrderService.getAllOrders).toHaveBeenCalledWith(20, 10);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        it('should handle invalid pagination parameters', async () => {
            // Setup
            mockRequest.query = { limit: 'invalid', offset: '10' };

            // Execute
            await orderController.getAllOrders(mockRequest, mockResponse, mockNext);

            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
        });
    });

    describe('getOrderById', () => {
        it('should return an order by ID', async () => {
            // Setup
            mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
            mockOrderService.getOrderById = jest.fn().mockResolvedValue(validOrderData);

            // Execute
            await orderController.getOrderById(mockRequest, mockResponse, mockNext);

            // Assert
            expect(mockOrderService.getOrderById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Order retrieved successfully',
                    data: validOrderData
                })
            );
        });

        it('should handle not found error', async () => {
            // Setup
            mockRequest.params = { id: 'non-existent-id' };
            const error = new NotFoundError('Order not found');
            mockOrderService.getOrderById = jest.fn().mockRejectedValue(error);

            // Execute
            await orderController.getOrderById(mockRequest, mockResponse, mockNext);

            // Assert
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe('updateOrder', () => {
        it('should update an order and return 200 status', async () => {
            // Setup
            mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
            mockRequest.body = { customerName: 'Jane Doe' };

            const updatedOrder = {
                ...validOrderData,
                customerName: 'Jane Doe'
            };

            mockOrderService.updateOrder = jest.fn().mockResolvedValue(updatedOrder);

            // Execute
            await orderController.updateOrder(mockRequest, mockResponse, mockNext);

            // Assert
            expect(mockOrderService.updateOrder).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', { customerName: 'Jane Doe' });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Order updated successfully',
                    data: updatedOrder
                })
            );
        });
    });

    describe('deleteOrder', () => {
        it('should delete an order and return 200 status', async () => {
            // Setup
            mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
            mockOrderService.deleteOrder = jest.fn().mockResolvedValue(true);

            // Execute
            await orderController.deleteOrder(mockRequest, mockResponse, mockNext);

            // Assert
            expect(mockOrderService.deleteOrder).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Order deleted successfully'
                })
            );
        });
    });

    describe('getOrdersByStatus', () => {
        it('should return orders filtered by status', async () => {
            // Setup
            mockRequest.params = { status: OrderStatus.PENDING };
            mockOrderService.getOrdersByStatus = jest.fn().mockResolvedValue([validOrderData]);

            // Execute
            await orderController.getOrdersByStatus(mockRequest, mockResponse, mockNext);

            // Assert
            expect(mockOrderService.getOrdersByStatus).toHaveBeenCalledWith(OrderStatus.PENDING);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Orders retrieved successfully',
                    data: [validOrderData],
                    count: 1
                })
            );
        });

        it('should handle invalid status parameter', async () => {
            // Setup
            mockRequest.params = { status: 'invalid-status' };

            // Execute
            await orderController.getOrdersByStatus(mockRequest, mockResponse, mockNext);

            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
        });
    });

    describe('updateOrderStatus', () => {
        it('should update order status and return 200 status', async () => {
            // Setup
            mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
            mockRequest.body = { status: OrderStatus.CONSOLIDATED };

            const updatedOrder = {
                ...validOrderData,
                status: OrderStatus.CONSOLIDATED
            };

            mockOrderService.updateOrderStatus = jest.fn().mockResolvedValue(updatedOrder);

            // Execute
            await orderController.updateOrderStatus(mockRequest, mockResponse, mockNext);

            // Assert
            expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', OrderStatus.CONSOLIDATED);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Order status updated successfully',
                    data: updatedOrder
                })
            );
        });

        it('should handle invalid status parameter', async () => {
            // Setup
            mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
            mockRequest.body = { status: 'invalid-status' };

            // Execute
            await orderController.updateOrderStatus(mockRequest, mockResponse, mockNext);

            // Assert
            expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
        });
    });

    describe('getOrdersNeedingReview', () => {
        it('should return orders needing review', async () => {
            // Setup
            mockOrderService.getOrdersNeedingReview = jest.fn().mockResolvedValue([validOrderData]);

            // Execute
            await orderController.getOrdersNeedingReview(mockRequest, mockResponse, mockNext);

            // Assert
            expect(mockOrderService.getOrdersNeedingReview).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Orders needing review retrieved successfully',
                    data: [validOrderData],
                    count: 1
                })
            );
        });
    });
});
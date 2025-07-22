"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDispatch = exports.testRoute = exports.testLoad = exports.testVehicle = exports.testOrder = void 0;
const index_1 = require("./index");
const testOrder = {
    id: 'order-123',
    customerId: 'customer-456',
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
    packageDetails: [{
            id: 'package-789',
            description: 'Electronics',
            weight: 2.5,
            dimensions: {
                length: 30,
                width: 20,
                height: 10
            },
            fragile: true
        }],
    specialInstructions: 'Handle with care',
    timeWindow: {
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T17:00:00Z')
    },
    status: index_1.OrderStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date()
};
exports.testOrder = testOrder;
const testVehicle = {
    id: 'vehicle-123',
    licensePlate: 'ABC-123',
    type: index_1.VehicleType.VAN,
    capacity: {
        maxWeight: 1000,
        maxVolume: 50,
        maxPackages: 20
    },
    currentLocation: {
        latitude: 37.7749,
        longitude: -122.4194
    },
    status: index_1.VehicleStatus.AVAILABLE,
    driverId: 'driver-456',
    createdAt: new Date(),
    updatedAt: new Date()
};
exports.testVehicle = testVehicle;
const testLoad = {
    id: 'load-123',
    orders: ['order-123', 'order-456'],
    vehicleId: 'vehicle-123',
    totalWeight: 5.0,
    totalVolume: 2.5,
    status: index_1.LoadStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date()
};
exports.testLoad = testLoad;
const testRoute = {
    id: 'route-123',
    loadId: 'load-123',
    vehicleId: 'vehicle-123',
    stops: [{
            orderId: 'order-123',
            address: testOrder.deliveryAddress,
            sequence: 1,
            estimatedArrival: new Date('2024-01-01T10:00:00Z'),
            actualArrival: new Date('2024-01-01T10:15:00Z'),
            deliveryStatus: index_1.DeliveryStatus.DELIVERED,
            deliveryProof: {
                signature: 'base64-signature',
                photo: 'base64-photo',
                notes: 'Delivered successfully',
                timestamp: new Date()
            }
        }],
    totalDistance: 25.5,
    estimatedDuration: 3600,
    status: index_1.RouteStatus.PLANNED,
    createdAt: new Date(),
    updatedAt: new Date()
};
exports.testRoute = testRoute;
const testDispatch = {
    id: 'dispatch-123',
    routeId: 'route-123',
    vehicleId: 'vehicle-123',
    driverId: 'driver-456',
    status: index_1.DispatchStatus.PENDING,
    startTime: new Date(),
    completedTime: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
};
exports.testDispatch = testDispatch;
//# sourceMappingURL=test-types.js.map
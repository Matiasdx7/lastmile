"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispatchService = void 0;
const types_1 = require("../../../shared/types");
const WebSocketManager_1 = require("./WebSocketManager");
const axios_1 = __importDefault(require("axios"));
class DispatchService {
    constructor(dispatchRepository, routeRepository, orderRepository, vehicleRepository, webSocketPort = 3014) {
        this.dispatchRepository = dispatchRepository;
        this.routeRepository = routeRepository;
        this.orderRepository = orderRepository;
        this.vehicleRepository = vehicleRepository;
        this.webSocketManager = new WebSocketManager_1.WebSocketManager(webSocketPort);
    }
    async createDispatch(dispatch) {
        const route = await this.routeRepository.findById(dispatch.routeId);
        if (!route) {
            throw new Error('Route not found');
        }
        const existingDispatch = await this.dispatchRepository.findByRouteId(dispatch.routeId);
        if (existingDispatch) {
            throw new Error('Route is already dispatched');
        }
        return this.dispatchRepository.create(dispatch);
    }
    async getDispatchById(id) {
        return this.dispatchRepository.findById(id);
    }
    async getAllDispatches() {
        return this.dispatchRepository.findAll();
    }
    async getActiveDispatches() {
        return this.dispatchRepository.findByStatus(types_1.DispatchStatus.ACTIVE);
    }
    async confirmDispatch(id) {
        const dispatch = await this.dispatchRepository.findById(id);
        if (!dispatch) {
            return null;
        }
        const route = await this.routeRepository.findById(dispatch.routeId);
        if (!route) {
            throw new Error('Route not found');
        }
        const updatedDispatch = await this.dispatchRepository.startDispatch(id);
        if (!updatedDispatch) {
            throw new Error('Failed to update dispatch status');
        }
        await this.routeRepository.updateStatus(route.id, types_1.RouteStatus.IN_PROGRESS);
        for (const stop of route.stops) {
            await this.orderRepository.updateStatus(stop.orderId, types_1.OrderStatus.IN_TRANSIT);
        }
        return updatedDispatch;
    }
    async getRouteSummary(dispatchId) {
        const dispatch = await this.dispatchRepository.findById(dispatchId);
        if (!dispatch) {
            return null;
        }
        const route = await this.routeRepository.findById(dispatch.routeId);
        if (!route) {
            return null;
        }
        const summary = {
            dispatchId,
            route,
            totalStops: route.stops.length,
            totalDistance: route.totalDistance,
            estimatedDuration: route.estimatedDuration,
            stops: route.stops.map(stop => ({
                orderId: stop.orderId,
                address: `${stop.address.street}, ${stop.address.city}, ${stop.address.state} ${stop.address.zipCode}`,
                sequence: stop.sequence,
                estimatedArrival: stop.estimatedArrival
            }))
        };
        return summary;
    }
    async getDetailedRouteSummary(dispatchId) {
        const summary = await this.getRouteSummary(dispatchId);
        if (!summary) {
            return null;
        }
        const dispatch = await this.dispatchRepository.findById(dispatchId);
        if (!dispatch) {
            return null;
        }
        const vehicle = await this.vehicleRepository.findById(dispatch.vehicleId);
        if (!vehicle) {
            throw new Error('Vehicle not found');
        }
        const orderIds = summary.stops.map(stop => stop.orderId);
        const orders = [];
        for (const orderId of orderIds) {
            const order = await this.orderRepository.findById(orderId);
            if (order) {
                orders.push(order);
            }
        }
        const detailedSummary = {
            ...summary,
            vehicle: {
                id: vehicle.id,
                licensePlate: vehicle.licensePlate,
                type: vehicle.type
            },
            driver: {
                id: dispatch.driverId,
                name: 'Driver information would be fetched from driver service'
            },
            orders: orders.map(order => ({
                id: order.id,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                packageDetails: order.packageDetails,
                specialInstructions: order.specialInstructions
            }))
        };
        return detailedSummary;
    }
    async sendRouteToDriver(dispatchId) {
        const dispatch = await this.dispatchRepository.findById(dispatchId);
        if (!dispatch) {
            return false;
        }
        const detailedRouteSummary = await this.getDetailedRouteSummary(dispatchId);
        if (!detailedRouteSummary) {
            return false;
        }
        console.log(`Detailed route information sent to driver ${dispatch.driverId} for dispatch ${dispatchId}`);
        console.log(`Route contains ${detailedRouteSummary.totalStops} stops and will take approximately ${detailedRouteSummary.estimatedDuration} minutes`);
        return true;
    }
    async confirmDispatchAndSendRoute(id) {
        const confirmedDispatch = await this.confirmDispatch(id);
        if (!confirmedDispatch) {
            return { dispatch: null, routeSent: false };
        }
        const routeSent = await this.sendRouteToDriver(id);
        return {
            dispatch: confirmedDispatch,
            routeSent
        };
    }
    async updateDispatchStatus(id, status) {
        const dispatch = await this.dispatchRepository.findById(id);
        if (!dispatch) {
            return null;
        }
        const previousStatus = dispatch.status;
        const updatedDispatch = await this.dispatchRepository.updateStatus(id, status);
        if (updatedDispatch) {
            this.webSocketManager.broadcastDispatchStatusChange({
                dispatchId: id,
                previousStatus,
                newStatus: status,
                timestamp: new Date()
            });
        }
        return updatedDispatch;
    }
    async updateVehicleLocation(dispatchId, location, speed, heading) {
        const dispatch = await this.dispatchRepository.findById(dispatchId);
        if (!dispatch || dispatch.status !== types_1.DispatchStatus.ACTIVE) {
            return false;
        }
        await this.vehicleRepository.updateLocation(dispatch.vehicleId, location.latitude, location.longitude);
        this.webSocketManager.broadcastLocationUpdate({
            dispatchId,
            vehicleId: dispatch.vehicleId,
            location,
            timestamp: new Date(),
            speed,
            heading
        });
        return true;
    }
    async getDispatchLocation(dispatchId) {
        const dispatch = await this.dispatchRepository.findById(dispatchId);
        if (!dispatch) {
            return null;
        }
        const vehicle = await this.vehicleRepository.findById(dispatch.vehicleId);
        if (!vehicle || !vehicle.currentLocation) {
            return null;
        }
        return vehicle.currentLocation;
    }
    async sendCriticalNotification(dispatchId, type, message, metadata) {
        const dispatch = await this.dispatchRepository.findById(dispatchId);
        if (!dispatch) {
            return false;
        }
        this.webSocketManager.broadcastCriticalNotification({
            dispatchId,
            type,
            message,
            timestamp: new Date(),
            metadata
        });
        return true;
    }
    async detectAndNotifyDelays(dispatchId) {
        const dispatch = await this.dispatchRepository.findById(dispatchId);
        if (!dispatch || dispatch.status !== types_1.DispatchStatus.ACTIVE) {
            return false;
        }
        const route = await this.routeRepository.findById(dispatch.routeId);
        if (!route) {
            return false;
        }
        const vehicleLocation = await this.getDispatchLocation(dispatchId);
        if (!vehicleLocation) {
            return false;
        }
        const simulatedDelay = Math.random() > 0.7;
        if (simulatedDelay) {
            const nextStop = route.stops.find((stop) => !stop.actualArrival);
            if (nextStop) {
                const delayMinutes = Math.floor(Math.random() * 30) + 5;
                await this.sendCriticalNotification(dispatchId, WebSocketManager_1.NotificationType.DELAY, `Potential delay of ${delayMinutes} minutes detected for delivery to stop #${nextStop.sequence}`, {
                    stopId: nextStop.orderId,
                    estimatedDelay: delayMinutes,
                    originalEta: nextStop.estimatedArrival
                });
                return true;
            }
        }
        return false;
    }
    async recordDeliverySuccess(stopId, orderId, proof) {
        try {
            const routes = await this.routeRepository.findAll();
            const route = routes.find(r => r.stops.some((stop) => stop.orderId === orderId));
            if (!route) {
                return false;
            }
            const dispatch = await this.dispatchRepository.findByRouteId(route.id);
            if (!dispatch) {
                return false;
            }
            const stopIndex = route.stops.findIndex((stop) => stop.orderId === orderId);
            if (stopIndex === -1) {
                return false;
            }
            const updatedStop = {
                ...route.stops[stopIndex],
                actualArrival: new Date(),
                deliveryStatus: types_1.DeliveryStatus.DELIVERED,
                deliveryProof: {
                    signature: proof.signature,
                    photo: proof.photo,
                    notes: proof.notes,
                    timestamp: new Date()
                }
            };
            route.stops[stopIndex] = updatedStop;
            await this.routeRepository.update(route.id, route);
            await this.orderRepository.updateStatus(orderId, types_1.OrderStatus.DELIVERED);
            await this.sendDeliveryNotifications(orderId, dispatch.id, 'delivered', proof);
            const routeCompletion = await this.checkRouteCompletion(dispatch.id);
            if (routeCompletion.isCompleted) {
                await this.updateDispatchStatus(dispatch.id, types_1.DispatchStatus.COMPLETED);
                await this.vehicleRepository.updateStatus(dispatch.vehicleId, types_1.VehicleStatus.AVAILABLE);
            }
            return true;
        }
        catch (error) {
            console.error('Error recording delivery success:', error);
            return false;
        }
    }
    async recordDeliveryFailure(stopId, orderId, failureDetails) {
        try {
            const routes = await this.routeRepository.findAll();
            const route = routes.find(r => r.stops.some((stop) => stop.orderId === orderId));
            if (!route) {
                return false;
            }
            const dispatch = await this.dispatchRepository.findByRouteId(route.id);
            if (!dispatch) {
                return false;
            }
            const stopIndex = route.stops.findIndex((stop) => stop.orderId === orderId);
            if (stopIndex === -1) {
                return false;
            }
            const updatedStop = {
                ...route.stops[stopIndex],
                actualArrival: new Date(),
                deliveryStatus: types_1.DeliveryStatus.FAILED,
                deliveryProof: {
                    failureReason: failureDetails.reason,
                    photo: failureDetails.photo,
                    notes: failureDetails.notes,
                    nextAction: failureDetails.nextAction,
                    timestamp: new Date()
                }
            };
            route.stops[stopIndex] = updatedStop;
            await this.routeRepository.update(route.id, route);
            await this.orderRepository.updateStatus(orderId, types_1.OrderStatus.FAILED);
            await this.sendDeliveryNotifications(orderId, dispatch.id, 'failed', failureDetails);
            const routeCompletion = await this.checkRouteCompletion(dispatch.id);
            if (routeCompletion.isCompleted) {
                await this.updateDispatchStatus(dispatch.id, types_1.DispatchStatus.COMPLETED);
                await this.vehicleRepository.updateStatus(dispatch.vehicleId, types_1.VehicleStatus.AVAILABLE);
            }
            return true;
        }
        catch (error) {
            console.error('Error recording delivery failure:', error);
            return false;
        }
    }
    async checkRouteCompletion(dispatchId) {
        const dispatch = await this.dispatchRepository.findById(dispatchId);
        if (!dispatch) {
            return { isCompleted: false, completedStops: 0, totalStops: 0, remainingStops: 0 };
        }
        const route = await this.routeRepository.findById(dispatch.routeId);
        if (!route) {
            return { isCompleted: false, completedStops: 0, totalStops: 0, remainingStops: 0 };
        }
        const totalStops = route.stops.length;
        const completedStops = route.stops.filter((stop) => stop.deliveryStatus === types_1.DeliveryStatus.DELIVERED ||
            stop.deliveryStatus === types_1.DeliveryStatus.FAILED).length;
        const remainingStops = totalStops - completedStops;
        const isCompleted = remainingStops === 0;
        return {
            isCompleted,
            completedStops,
            totalStops,
            remainingStops
        };
    }
    async sendDeliveryNotifications(orderId, dispatchId, status, details) {
        try {
            const order = await this.orderRepository.findById(orderId);
            if (!order) {
                console.error(`Cannot send notification: Order ${orderId} not found`);
                return;
            }
            const notificationData = {
                orderId,
                dispatchId,
                status,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                deliveryAddress: order.deliveryAddress,
                timestamp: new Date().toISOString(),
                details
            };
            try {
                await axios_1.default.post('http://notification-service:3005/api/notifications', notificationData);
                console.log(`Delivery ${status} notification sent for order ${orderId}`);
            }
            catch (error) {
                console.error(`Failed to send notification for order ${orderId}:`, error);
                this.webSocketManager.broadcastCriticalNotification({
                    dispatchId,
                    type: status === 'delivered' ? WebSocketManager_1.NotificationType.DELIVERY_EXCEPTION : WebSocketManager_1.NotificationType.DELIVERY_EXCEPTION,
                    message: `Order ${orderId} ${status === 'delivered' ? 'delivered successfully' : 'delivery failed'}`,
                    timestamp: new Date(),
                    metadata: notificationData
                });
            }
        }
        catch (error) {
            console.error('Error sending delivery notifications:', error);
        }
    }
}
exports.DispatchService = DispatchService;
//# sourceMappingURL=DispatchService.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispatchController = void 0;
const types_1 = require("../../../shared/types");
const uuid_1 = require("uuid");
const WebSocketManager_1 = require("../services/WebSocketManager");
class DispatchController {
    constructor(dispatchService) {
        this.dispatchService = dispatchService;
    }
    async createDispatch(req, res) {
        try {
            const { routeId, vehicleId, driverId } = req.body;
            const dispatch = await this.dispatchService.createDispatch({
                id: (0, uuid_1.v4)(),
                routeId,
                vehicleId,
                driverId,
                status: types_1.DispatchStatus.PENDING,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            res.status(201).json(dispatch);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getDispatch(req, res) {
        try {
            const { id } = req.params;
            const dispatch = await this.dispatchService.getDispatchById(id);
            if (!dispatch) {
                res.status(404).json({ error: 'Dispatch not found' });
                return;
            }
            res.status(200).json(dispatch);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getAllDispatches(req, res) {
        try {
            const dispatches = await this.dispatchService.getAllDispatches();
            res.status(200).json(dispatches);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getActiveDispatches(req, res) {
        try {
            const dispatches = await this.dispatchService.getActiveDispatches();
            res.status(200).json(dispatches);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async confirmDispatch(req, res) {
        try {
            const { id } = req.params;
            const dispatch = await this.dispatchService.confirmDispatch(id);
            if (!dispatch) {
                res.status(404).json({ error: 'Dispatch not found' });
                return;
            }
            res.status(200).json(dispatch);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getRouteSummary(req, res) {
        try {
            const { id } = req.params;
            const routeSummary = await this.dispatchService.getRouteSummary(id);
            if (!routeSummary) {
                res.status(404).json({ error: 'Route summary not found' });
                return;
            }
            res.status(200).json(routeSummary);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async sendRouteToDriver(req, res) {
        try {
            const { id } = req.params;
            const result = await this.dispatchService.sendRouteToDriver(id);
            if (!result) {
                res.status(404).json({ error: 'Dispatch not found' });
                return;
            }
            res.status(200).json({ message: 'Route sent to driver successfully', dispatchId: id });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getDetailedRouteSummary(req, res) {
        try {
            const { id } = req.params;
            const detailedSummary = await this.dispatchService.getDetailedRouteSummary(id);
            if (!detailedSummary) {
                res.status(404).json({ error: 'Detailed route summary not found' });
                return;
            }
            res.status(200).json(detailedSummary);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async confirmDispatchAndSendRoute(req, res) {
        try {
            const { id } = req.params;
            const result = await this.dispatchService.confirmDispatchAndSendRoute(id);
            if (!result.dispatch) {
                res.status(404).json({ error: 'Dispatch not found' });
                return;
            }
            res.status(200).json({
                message: 'Dispatch confirmed and route sent to driver',
                dispatch: result.dispatch,
                routeSent: result.routeSent
            });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async updateDispatchStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const dispatch = await this.dispatchService.updateDispatchStatus(id, status);
            if (!dispatch) {
                res.status(404).json({ error: 'Dispatch not found' });
                return;
            }
            res.status(200).json(dispatch);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async updateVehicleLocation(req, res) {
        try {
            const { id } = req.params;
            const { latitude, longitude, speed, heading } = req.body;
            if (!latitude || !longitude) {
                res.status(400).json({ error: 'Latitude and longitude are required' });
                return;
            }
            const location = { latitude, longitude };
            const result = await this.dispatchService.updateVehicleLocation(id, location, speed, heading);
            if (!result) {
                res.status(404).json({ error: 'Dispatch not found or not active' });
                return;
            }
            res.status(200).json({
                message: 'Vehicle location updated successfully',
                dispatchId: id,
                location
            });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getDispatchLocation(req, res) {
        try {
            const { id } = req.params;
            const location = await this.dispatchService.getDispatchLocation(id);
            if (!location) {
                res.status(404).json({ error: 'Location not found for this dispatch' });
                return;
            }
            res.status(200).json(location);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async sendCriticalNotification(req, res) {
        try {
            const { id } = req.params;
            const { type, message, metadata } = req.body;
            if (!type || !message) {
                res.status(400).json({ error: 'Notification type and message are required' });
                return;
            }
            if (!Object.values(WebSocketManager_1.NotificationType).includes(type)) {
                res.status(400).json({ error: `Invalid notification type: ${type}` });
                return;
            }
            const result = await this.dispatchService.sendCriticalNotification(id, type, message, metadata);
            if (!result) {
                res.status(404).json({ error: 'Dispatch not found' });
                return;
            }
            res.status(200).json({
                message: 'Critical notification sent successfully',
                dispatchId: id,
                notificationType: type
            });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async detectAndNotifyDelays(req, res) {
        try {
            const { id } = req.params;
            const result = await this.dispatchService.detectAndNotifyDelays(id);
            res.status(200).json({
                message: result ? 'Delay detected and notification sent' : 'No delays detected',
                dispatchId: id
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async recordDeliverySuccess(req, res) {
        try {
            const { stopId } = req.params;
            const { orderId, proof } = req.body;
            if (!orderId || !proof) {
                res.status(400).json({ error: 'Order ID and delivery proof are required' });
                return;
            }
            const result = await this.dispatchService.recordDeliverySuccess(stopId, orderId, proof);
            if (!result) {
                res.status(404).json({ error: 'Stop or order not found' });
                return;
            }
            res.status(200).json({
                message: 'Delivery confirmed successfully',
                stopId,
                orderId,
                status: 'delivered'
            });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async recordDeliveryFailure(req, res) {
        try {
            const { stopId } = req.params;
            const { orderId, failureDetails } = req.body;
            if (!orderId || !failureDetails || !failureDetails.reason) {
                res.status(400).json({ error: 'Order ID and failure details are required' });
                return;
            }
            const result = await this.dispatchService.recordDeliveryFailure(stopId, orderId, failureDetails);
            if (!result) {
                res.status(404).json({ error: 'Stop or order not found' });
                return;
            }
            res.status(200).json({
                message: 'Delivery failure recorded successfully',
                stopId,
                orderId,
                status: 'failed',
                nextAction: failureDetails.nextAction
            });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async checkRouteCompletion(req, res) {
        try {
            const { id } = req.params;
            const result = await this.dispatchService.checkRouteCompletion(id);
            res.status(200).json({
                dispatchId: id,
                isCompleted: result.isCompleted,
                completedStops: result.completedStops,
                totalStops: result.totalStops,
                remainingStops: result.remainingStops
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.DispatchController = DispatchController;
//# sourceMappingURL=DispatchController.js.map
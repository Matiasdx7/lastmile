"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketManager = exports.NotificationType = exports.WebSocketEvent = void 0;
const socket_io_1 = require("socket.io");
const http_1 = require("http");
var WebSocketEvent;
(function (WebSocketEvent) {
    WebSocketEvent["CONNECT"] = "connect";
    WebSocketEvent["DISCONNECT"] = "disconnect";
    WebSocketEvent["LOCATION_UPDATE"] = "location_update";
    WebSocketEvent["DISPATCH_STATUS_CHANGE"] = "dispatch_status_change";
    WebSocketEvent["CRITICAL_NOTIFICATION"] = "critical_notification";
    WebSocketEvent["JOIN_DISPATCH_ROOM"] = "join_dispatch_room";
    WebSocketEvent["LEAVE_DISPATCH_ROOM"] = "leave_dispatch_room";
})(WebSocketEvent || (exports.WebSocketEvent = WebSocketEvent = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["DELAY"] = "delay";
    NotificationType["ROUTE_CHANGE"] = "route_change";
    NotificationType["VEHICLE_ISSUE"] = "vehicle_issue";
    NotificationType["DELIVERY_EXCEPTION"] = "delivery_exception";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
class WebSocketManager {
    constructor(port) {
        this.connectedClients = new Map();
        this.dispatchRooms = new Map();
        const httpServer = (0, http_1.createServer)();
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });
        this.setupEventHandlers();
        httpServer.listen(port, () => {
            console.log(`WebSocket server running on port ${port}`);
        });
    }
    setupEventHandlers() {
        this.io.on(WebSocketEvent.CONNECT, (socket) => {
            console.log(`Client connected: ${socket.id}`);
            this.connectedClients.set(socket.id, socket);
            socket.on(WebSocketEvent.JOIN_DISPATCH_ROOM, (dispatchId) => {
                socket.join(`dispatch:${dispatchId}`);
                if (!this.dispatchRooms.has(dispatchId)) {
                    this.dispatchRooms.set(dispatchId, new Set());
                }
                this.dispatchRooms.get(dispatchId)?.add(socket.id);
                console.log(`Client ${socket.id} joined dispatch room: ${dispatchId}`);
            });
            socket.on(WebSocketEvent.LEAVE_DISPATCH_ROOM, (dispatchId) => {
                socket.leave(`dispatch:${dispatchId}`);
                this.dispatchRooms.get(dispatchId)?.delete(socket.id);
                console.log(`Client ${socket.id} left dispatch room: ${dispatchId}`);
            });
            socket.on(WebSocketEvent.DISCONNECT, () => {
                console.log(`Client disconnected: ${socket.id}`);
                this.connectedClients.delete(socket.id);
                this.dispatchRooms.forEach((clients, dispatchId) => {
                    if (clients.has(socket.id)) {
                        clients.delete(socket.id);
                    }
                });
            });
        });
    }
    broadcastLocationUpdate(event) {
        this.io.to(`dispatch:${event.dispatchId}`).emit(WebSocketEvent.LOCATION_UPDATE, event);
        console.log(`Location update broadcast for dispatch ${event.dispatchId}: ${JSON.stringify(event.location)}`);
    }
    broadcastDispatchStatusChange(event) {
        this.io.to(`dispatch:${event.dispatchId}`).emit(WebSocketEvent.DISPATCH_STATUS_CHANGE, event);
        console.log(`Status change broadcast for dispatch ${event.dispatchId}: ${event.newStatus}`);
    }
    broadcastCriticalNotification(event) {
        this.io.to(`dispatch:${event.dispatchId}`).emit(WebSocketEvent.CRITICAL_NOTIFICATION, event);
        console.log(`Critical notification broadcast for dispatch ${event.dispatchId}: ${event.type} - ${event.message}`);
    }
    getConnectedClientsCount(dispatchId) {
        return this.dispatchRooms.get(dispatchId)?.size || 0;
    }
    getTotalConnectedClients() {
        return this.connectedClients.size;
    }
}
exports.WebSocketManager = WebSocketManager;
//# sourceMappingURL=WebSocketManager.js.map
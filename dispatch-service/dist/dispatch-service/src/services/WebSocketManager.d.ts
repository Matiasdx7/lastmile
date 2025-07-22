import { Location } from '../../../shared/types';
export declare enum WebSocketEvent {
    CONNECT = "connect",
    DISCONNECT = "disconnect",
    LOCATION_UPDATE = "location_update",
    DISPATCH_STATUS_CHANGE = "dispatch_status_change",
    CRITICAL_NOTIFICATION = "critical_notification",
    JOIN_DISPATCH_ROOM = "join_dispatch_room",
    LEAVE_DISPATCH_ROOM = "leave_dispatch_room"
}
export declare enum NotificationType {
    DELAY = "delay",
    ROUTE_CHANGE = "route_change",
    VEHICLE_ISSUE = "vehicle_issue",
    DELIVERY_EXCEPTION = "delivery_exception"
}
export interface LocationUpdateEvent {
    dispatchId: string;
    vehicleId: string;
    location: Location;
    timestamp: Date;
    speed?: number;
    heading?: number;
}
export interface DispatchStatusChangeEvent {
    dispatchId: string;
    previousStatus: string;
    newStatus: string;
    timestamp: Date;
}
export interface CriticalNotificationEvent {
    dispatchId: string;
    type: NotificationType;
    message: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export declare class WebSocketManager {
    private io;
    private connectedClients;
    private dispatchRooms;
    constructor(port: number);
    private setupEventHandlers;
    broadcastLocationUpdate(event: LocationUpdateEvent): void;
    broadcastDispatchStatusChange(event: DispatchStatusChangeEvent): void;
    broadcastCriticalNotification(event: CriticalNotificationEvent): void;
    getConnectedClientsCount(dispatchId: string): number;
    getTotalConnectedClients(): number;
}
//# sourceMappingURL=WebSocketManager.d.ts.map
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import { Dispatch, Location, Vehicle } from '../../../shared/types';

/**
 * Event types for WebSocket communication
 */
export enum WebSocketEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  LOCATION_UPDATE = 'location_update',
  DISPATCH_STATUS_CHANGE = 'dispatch_status_change',
  CRITICAL_NOTIFICATION = 'critical_notification',
  JOIN_DISPATCH_ROOM = 'join_dispatch_room',
  LEAVE_DISPATCH_ROOM = 'leave_dispatch_room',
}

/**
 * Notification types for critical events
 */
export enum NotificationType {
  DELAY = 'delay',
  ROUTE_CHANGE = 'route_change',
  VEHICLE_ISSUE = 'vehicle_issue',
  DELIVERY_EXCEPTION = 'delivery_exception',
}

/**
 * Interface for location update events
 */
export interface LocationUpdateEvent {
  dispatchId: string;
  vehicleId: string;
  location: Location;
  timestamp: Date;
  speed?: number;
  heading?: number;
}

/**
 * Interface for dispatch status change events
 */
export interface DispatchStatusChangeEvent {
  dispatchId: string;
  previousStatus: string;
  newStatus: string;
  timestamp: Date;
}

/**
 * Interface for critical notification events
 */
export interface CriticalNotificationEvent {
  dispatchId: string;
  type: NotificationType;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * WebSocket Manager for handling real-time communication
 */
export class WebSocketManager {
  private io: Server;
  private connectedClients: Map<string, Socket> = new Map();
  private dispatchRooms: Map<string, Set<string>> = new Map();

  constructor(port: number) {
    const httpServer = createServer();
    this.io = new Server(httpServer, {
      cors: {
        origin: '*', // In production, restrict this to specific domains
        methods: ['GET', 'POST'],
      },
    });

    this.setupEventHandlers();
    httpServer.listen(port, () => {
      console.log(`WebSocket server running on port ${port}`);
    });
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupEventHandlers(): void {
    this.io.on(WebSocketEvent.CONNECT, (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);
      this.connectedClients.set(socket.id, socket);

      // Handle client joining a dispatch room
      socket.on(WebSocketEvent.JOIN_DISPATCH_ROOM, (dispatchId: string) => {
        socket.join(`dispatch:${dispatchId}`);
        if (!this.dispatchRooms.has(dispatchId)) {
          this.dispatchRooms.set(dispatchId, new Set());
        }
        this.dispatchRooms.get(dispatchId)?.add(socket.id);
        console.log(`Client ${socket.id} joined dispatch room: ${dispatchId}`);
      });

      // Handle client leaving a dispatch room
      socket.on(WebSocketEvent.LEAVE_DISPATCH_ROOM, (dispatchId: string) => {
        socket.leave(`dispatch:${dispatchId}`);
        this.dispatchRooms.get(dispatchId)?.delete(socket.id);
        console.log(`Client ${socket.id} left dispatch room: ${dispatchId}`);
      });

      // Handle client disconnection
      socket.on(WebSocketEvent.DISCONNECT, () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
        
        // Remove client from all dispatch rooms
        this.dispatchRooms.forEach((clients, dispatchId) => {
          if (clients.has(socket.id)) {
            clients.delete(socket.id);
          }
        });
      });
    });
  }

  /**
   * Broadcast a location update to all clients in a dispatch room
   */
  public broadcastLocationUpdate(event: LocationUpdateEvent): void {
    this.io.to(`dispatch:${event.dispatchId}`).emit(WebSocketEvent.LOCATION_UPDATE, event);
    console.log(`Location update broadcast for dispatch ${event.dispatchId}: ${JSON.stringify(event.location)}`);
  }

  /**
   * Broadcast a dispatch status change to all clients in a dispatch room
   */
  public broadcastDispatchStatusChange(event: DispatchStatusChangeEvent): void {
    this.io.to(`dispatch:${event.dispatchId}`).emit(WebSocketEvent.DISPATCH_STATUS_CHANGE, event);
    console.log(`Status change broadcast for dispatch ${event.dispatchId}: ${event.newStatus}`);
  }

  /**
   * Broadcast a critical notification to all clients in a dispatch room
   */
  public broadcastCriticalNotification(event: CriticalNotificationEvent): void {
    this.io.to(`dispatch:${event.dispatchId}`).emit(WebSocketEvent.CRITICAL_NOTIFICATION, event);
    console.log(`Critical notification broadcast for dispatch ${event.dispatchId}: ${event.type} - ${event.message}`);
  }

  /**
   * Get the number of connected clients for a specific dispatch
   */
  public getConnectedClientsCount(dispatchId: string): number {
    return this.dispatchRooms.get(dispatchId)?.size || 0;
  }

  /**
   * Get the total number of connected clients
   */
  public getTotalConnectedClients(): number {
    return this.connectedClients.size;
  }
}
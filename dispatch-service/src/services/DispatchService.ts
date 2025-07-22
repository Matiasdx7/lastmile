import {
  Dispatch,
  DispatchStatus,
  Route,
  RouteStatus,
  OrderStatus,
  Vehicle,
  Order,
  Location,
  DeliveryStatus,
  VehicleStatus
} from '../../../shared/types';
import { DispatchRepository } from '../../../shared/database/repositories/DispatchRepository';
import { RouteRepository } from '../../../shared/database/repositories/RouteRepository';
import { OrderRepository } from '../../../shared/database/repositories/OrderRepository';
import { VehicleRepository } from '../../../shared/database/repositories/VehicleRepository';
import {
  WebSocketManager,
  LocationUpdateEvent,
  DispatchStatusChangeEvent,
  CriticalNotificationEvent,
  NotificationType
} from './WebSocketManager';
import axios from 'axios';

interface RouteSummary {
  dispatchId: string;
  route: Route;
  totalStops: number;
  totalDistance: number;
  estimatedDuration: number;
  stops: {
    orderId: string;
    address: string;
    sequence: number;
    estimatedArrival: Date;
  }[];
}

interface DetailedRouteSummary extends RouteSummary {
  vehicle: {
    id: string;
    licensePlate: string;
    type: string;
  };
  driver: {
    id: string;
    name?: string;
  };
  orders: {
    id: string;
    customerName: string;
    customerPhone: string;
    packageDetails: any[];
    specialInstructions?: string;
  }[];
}

// Define a RouteStop interface for type safety
interface RouteStop {
  orderId: string;
  sequence: number;
  address?: any;
  estimatedArrival?: Date;
  actualArrival?: Date;
  deliveryStatus?: DeliveryStatus;
  [key: string]: any; // Allow for other properties
}

export class DispatchService {
  private webSocketManager: WebSocketManager;

  constructor(
    private dispatchRepository: DispatchRepository,
    private routeRepository: RouteRepository,
    private orderRepository: OrderRepository,
    private vehicleRepository: VehicleRepository,
    webSocketPort: number = 3014
  ) {
    // Initialize WebSocket manager
    this.webSocketManager = new WebSocketManager(webSocketPort);
  }

  /**
   * Create a new dispatch
   */
  async createDispatch(dispatch: Dispatch): Promise<Dispatch> {
    // Check if route exists
    const route = await this.routeRepository.findById(dispatch.routeId);
    if (!route) {
      throw new Error('Route not found');
    }

    // Check if route is already dispatched
    const existingDispatch = await this.dispatchRepository.findByRouteId(dispatch.routeId);
    if (existingDispatch) {
      throw new Error('Route is already dispatched');
    }

    // Create dispatch
    return this.dispatchRepository.create(dispatch);
  }

  /**
   * Get dispatch by ID
   */
  async getDispatchById(id: string): Promise<Dispatch | null> {
    return this.dispatchRepository.findById(id);
  }

  /**
   * Get all dispatches
   */
  async getAllDispatches(): Promise<Dispatch[]> {
    return this.dispatchRepository.findAll();
  }

  /**
   * Get active dispatches
   */
  async getActiveDispatches(): Promise<Dispatch[]> {
    return this.dispatchRepository.findByStatus(DispatchStatus.ACTIVE);
  }

  /**
   * Confirm dispatch and update orders to "in transit"
   */
  async confirmDispatch(id: string): Promise<Dispatch | null> {
    // Get dispatch
    const dispatch = await this.dispatchRepository.findById(id);
    if (!dispatch) {
      return null;
    }

    // Get route
    const route = await this.routeRepository.findById(dispatch.routeId);
    if (!route) {
      throw new Error('Route not found');
    }

    // Start dispatch
    const updatedDispatch = await this.dispatchRepository.startDispatch(id);
    if (!updatedDispatch) {
      throw new Error('Failed to update dispatch status');
    }

    // Update route status
    await this.routeRepository.updateStatus(route.id, RouteStatus.IN_PROGRESS);

    // Update all orders in the route to "in transit"
    for (const stop of route.stops) {
      await this.orderRepository.updateStatus(stop.orderId, OrderStatus.IN_TRANSIT);
    }

    return updatedDispatch;
  }

  /**
   * Get route summary for a dispatch
   */
  async getRouteSummary(dispatchId: string): Promise<RouteSummary | null> {
    // Get dispatch
    const dispatch = await this.dispatchRepository.findById(dispatchId);
    if (!dispatch) {
      return null;
    }

    // Get route
    const route = await this.routeRepository.findById(dispatch.routeId);
    if (!route) {
      return null;
    }

    // Create route summary
    const summary: RouteSummary = {
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

  /**
   * Get detailed route summary with vehicle, driver, and order information
   * This provides a comprehensive view for dispatch confirmation
   */
  async getDetailedRouteSummary(dispatchId: string): Promise<DetailedRouteSummary | null> {
    // Get basic route summary
    const summary = await this.getRouteSummary(dispatchId);
    if (!summary) {
      return null;
    }

    // Get dispatch details
    const dispatch = await this.dispatchRepository.findById(dispatchId);
    if (!dispatch) {
      return null;
    }

    // Get vehicle details
    const vehicle = await this.vehicleRepository.findById(dispatch.vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Get order details for all stops
    const orderIds = summary.stops.map(stop => stop.orderId);
    const orders: Order[] = [];

    for (const orderId of orderIds) {
      const order = await this.orderRepository.findById(orderId);
      if (order) {
        orders.push(order);
      }
    }

    // Create detailed summary
    const detailedSummary: DetailedRouteSummary = {
      ...summary,
      vehicle: {
        id: vehicle.id,
        licensePlate: vehicle.licensePlate,
        type: vehicle.type
      },
      driver: {
        id: dispatch.driverId,
        // In a real implementation, we would fetch driver details from a driver service
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

  /**
   * Send route information to driver's mobile device
   * In a real implementation, this would integrate with a notification service
   * or mobile app backend. For now, we'll simulate this by returning true.
   */
  async sendRouteToDriver(dispatchId: string): Promise<boolean> {
    // Get dispatch
    const dispatch = await this.dispatchRepository.findById(dispatchId);
    if (!dispatch) {
      return false;
    }

    // Get detailed route summary with all necessary information for the driver
    const detailedRouteSummary = await this.getDetailedRouteSummary(dispatchId);
    if (!detailedRouteSummary) {
      return false;
    }

    // In a real implementation, we would:
    // 1. Format the route data for mobile consumption
    // 2. Send a push notification to the driver's device
    // 3. Make the route data available through the mobile API
    // 4. Track delivery of the notification

    // For now, we'll just log the action and return true to simulate success
    console.log(`Detailed route information sent to driver ${dispatch.driverId} for dispatch ${dispatchId}`);
    console.log(`Route contains ${detailedRouteSummary.totalStops} stops and will take approximately ${detailedRouteSummary.estimatedDuration} minutes`);

    return true;
  }

  /**
   * Confirm dispatch with full workflow:
   * 1. Update dispatch status to ACTIVE
   * 2. Update all orders to IN_TRANSIT
   * 3. Send route information to driver
   * 
   * This provides a single method to handle the complete dispatch confirmation process
   */
  async confirmDispatchAndSendRoute(id: string): Promise<{ dispatch: Dispatch | null, routeSent: boolean }> {
    // First confirm the dispatch (updates status and orders)
    const confirmedDispatch = await this.confirmDispatch(id);
    if (!confirmedDispatch) {
      return { dispatch: null, routeSent: false };
    }

    // Then send the route information to the driver
    const routeSent = await this.sendRouteToDriver(id);

    return {
      dispatch: confirmedDispatch,
      routeSent
    };
  }

  /**
   * Update dispatch status
   */
  async updateDispatchStatus(id: string, status: DispatchStatus): Promise<Dispatch | null> {
    const dispatch = await this.dispatchRepository.findById(id);
    if (!dispatch) {
      return null;
    }

    const previousStatus = dispatch.status;
    const updatedDispatch = await this.dispatchRepository.updateStatus(id, status);

    if (updatedDispatch) {
      // Broadcast status change via WebSocket
      this.webSocketManager.broadcastDispatchStatusChange({
        dispatchId: id,
        previousStatus,
        newStatus: status,
        timestamp: new Date()
      });
    }

    return updatedDispatch;
  }

  /**
   * Update vehicle location for a dispatch
   * This method receives location updates from the driver's mobile app
   * and broadcasts them to all clients tracking this dispatch
   */
  async updateVehicleLocation(dispatchId: string, location: Location, speed?: number, heading?: number): Promise<boolean> {
    // Get dispatch
    const dispatch = await this.dispatchRepository.findById(dispatchId);
    if (!dispatch || dispatch.status !== DispatchStatus.ACTIVE) {
      return false;
    }

    // Update vehicle location in the database
    await this.vehicleRepository.updateLocation(dispatch.vehicleId, location.latitude, location.longitude);

    // Broadcast location update via WebSocket
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

  /**
   * Get the last known location for a dispatch
   */
  async getDispatchLocation(dispatchId: string): Promise<Location | null> {
    // Get dispatch
    const dispatch = await this.dispatchRepository.findById(dispatchId);
    if (!dispatch) {
      return null;
    }

    // Get vehicle
    const vehicle = await this.vehicleRepository.findById(dispatch.vehicleId);
    if (!vehicle || !vehicle.currentLocation) {
      return null;
    }

    return vehicle.currentLocation;
  }

  /**
   * Send a critical notification for a dispatch
   * This can be used to notify about delays, route changes, or other important events
   */
  async sendCriticalNotification(
    dispatchId: string,
    type: NotificationType,
    message: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    // Get dispatch
    const dispatch = await this.dispatchRepository.findById(dispatchId);
    if (!dispatch) {
      return false;
    }

    // Broadcast notification via WebSocket
    this.webSocketManager.broadcastCriticalNotification({
      dispatchId,
      type,
      message,
      timestamp: new Date(),
      metadata
    });

    // In a real implementation, we might also:
    // 1. Store the notification in the database
    // 2. Send push notifications to mobile devices
    // 3. Send SMS or email alerts for critical issues

    return true;
  }

  /**
   * Detect and notify about potential delays based on current location and estimated arrival times
   * This method would typically be called by a background job that periodically checks active dispatches
   */
  async detectAndNotifyDelays(dispatchId: string): Promise<boolean> {
    // Get dispatch
    const dispatch = await this.dispatchRepository.findById(dispatchId);
    if (!dispatch || dispatch.status !== DispatchStatus.ACTIVE) {
      return false;
    }

    // Get route
    const route = await this.routeRepository.findById(dispatch.routeId);
    if (!route) {
      return false;
    }

    // Get current vehicle location
    const vehicleLocation = await this.getDispatchLocation(dispatchId);
    if (!vehicleLocation) {
      return false;
    }

    // In a real implementation, we would:
    // 1. Calculate the current position along the route
    // 2. Compare with expected position based on timestamps
    // 3. Estimate potential delays for upcoming stops
    // 4. Send notifications if delays exceed thresholds

    // For this prototype, we'll simulate detecting a delay
    const simulatedDelay = Math.random() > 0.7; // 30% chance of delay for demonstration

    if (simulatedDelay) {
      const nextStop = route.stops.find((stop: RouteStop) => !stop.actualArrival);
      if (nextStop) {
        const delayMinutes = Math.floor(Math.random() * 30) + 5; // 5-35 minutes delay

        await this.sendCriticalNotification(
          dispatchId,
          NotificationType.DELAY,
          `Potential delay of ${delayMinutes} minutes detected for delivery to stop #${nextStop.sequence}`,
          {
            stopId: nextStop.orderId,
            estimatedDelay: delayMinutes,
            originalEta: nextStop.estimatedArrival
          }
        );

        return true;
      }
    }

    return false;
  }
  
  /**
   * Record a successful delivery
   */
  async recordDeliverySuccess(stopId: string, orderId: string, proof: any): Promise<boolean> {
    try {
      // Find the route containing this stop
      const routes = await this.routeRepository.findAll();
      const route = routes.find(r => r.stops.some((stop: RouteStop) => stop.orderId === orderId));
      if (!route) {
        return false;
      }
      
      // Find the dispatch
      const dispatch = await this.dispatchRepository.findByRouteId(route.id);
      if (!dispatch) {
        return false;
      }
      
      // Find the stop in the route
      const stopIndex = route.stops.findIndex((stop: RouteStop) => stop.orderId === orderId);
      if (stopIndex === -1) {
        return false;
      }
      
      // Update the stop with delivery information
      const updatedStop = {
        ...route.stops[stopIndex],
        actualArrival: new Date(),
        deliveryStatus: DeliveryStatus.DELIVERED,
        deliveryProof: {
          signature: proof.signature,
          photo: proof.photo,
          notes: proof.notes,
          timestamp: new Date()
        }
      };
      
      // Update the route with the new stop information
      route.stops[stopIndex] = updatedStop;
      await this.routeRepository.update(route.id, route);
      
      // Update the order status to DELIVERED
      await this.orderRepository.updateStatus(orderId, OrderStatus.DELIVERED);
      
      // Send notification to customer and coordinator
      await this.sendDeliveryNotifications(orderId, dispatch.id, 'delivered', proof);
      
      // Check if all deliveries in the route are completed
      const routeCompletion = await this.checkRouteCompletion(dispatch.id);
      if (routeCompletion.isCompleted) {
        // Update dispatch status to COMPLETED
        await this.updateDispatchStatus(dispatch.id, DispatchStatus.COMPLETED);
        
        // Update vehicle status to AVAILABLE
        await this.vehicleRepository.updateStatus(dispatch.vehicleId, VehicleStatus.AVAILABLE);
      }
      
      return true;
    } catch (error) {
      console.error('Error recording delivery success:', error);
      return false;
    }
  }
  
  /**
   * Record a failed delivery attempt
   */
  async recordDeliveryFailure(stopId: string, orderId: string, failureDetails: any): Promise<boolean> {
    try {
      // Find the route containing this stop
      const routes = await this.routeRepository.findAll();
      const route = routes.find(r => r.stops.some((stop: RouteStop) => stop.orderId === orderId));
      if (!route) {
        return false;
      }
      
      // Find the dispatch
      const dispatch = await this.dispatchRepository.findByRouteId(route.id);
      if (!dispatch) {
        return false;
      }
      
      // Find the stop in the route
      const stopIndex = route.stops.findIndex((stop: RouteStop) => stop.orderId === orderId);
      if (stopIndex === -1) {
        return false;
      }
      
      // Update the stop with delivery failure information
      const updatedStop = {
        ...route.stops[stopIndex],
        actualArrival: new Date(),
        deliveryStatus: DeliveryStatus.FAILED,
        deliveryProof: {
          failureReason: failureDetails.reason,
          photo: failureDetails.photo,
          notes: failureDetails.notes,
          nextAction: failureDetails.nextAction,
          timestamp: new Date()
        }
      };
      
      // Update the route with the new stop information
      route.stops[stopIndex] = updatedStop;
      await this.routeRepository.update(route.id, route);
      
      // Update the order status to FAILED
      await this.orderRepository.updateStatus(orderId, OrderStatus.FAILED);
      
      // Send notification to customer and coordinator
      await this.sendDeliveryNotifications(orderId, dispatch.id, 'failed', failureDetails);
      
      // Check if all deliveries in the route are completed or failed
      const routeCompletion = await this.checkRouteCompletion(dispatch.id);
      if (routeCompletion.isCompleted) {
        // Update dispatch status to COMPLETED
        await this.updateDispatchStatus(dispatch.id, DispatchStatus.COMPLETED);
        
        // Update vehicle status to AVAILABLE
        await this.vehicleRepository.updateStatus(dispatch.vehicleId, VehicleStatus.AVAILABLE);
      }
      
      return true;
    } catch (error) {
      console.error('Error recording delivery failure:', error);
      return false;
    }
  }
  
  /**
   * Check if all deliveries in a route are completed or failed
   */
  async checkRouteCompletion(dispatchId: string): Promise<{
    isCompleted: boolean;
    completedStops: number;
    totalStops: number;
    remainingStops: number;
  }> {
    // Get dispatch
    const dispatch = await this.dispatchRepository.findById(dispatchId);
    if (!dispatch) {
      return { isCompleted: false, completedStops: 0, totalStops: 0, remainingStops: 0 };
    }
    
    // Get route
    const route = await this.routeRepository.findById(dispatch.routeId);
    if (!route) {
      return { isCompleted: false, completedStops: 0, totalStops: 0, remainingStops: 0 };
    }
    
    // Count completed stops
    const totalStops = route.stops.length;
    const completedStops = route.stops.filter((stop: RouteStop) => 
      stop.deliveryStatus === DeliveryStatus.DELIVERED || 
      stop.deliveryStatus === DeliveryStatus.FAILED
    ).length;
    
    const remainingStops = totalStops - completedStops;
    const isCompleted = remainingStops === 0;
    
    return {
      isCompleted,
      completedStops,
      totalStops,
      remainingStops
    };
  }
  
  /**
   * Send notifications about delivery status to customer and coordinator
   */
  async sendDeliveryNotifications(
    orderId: string, 
    dispatchId: string, 
    status: 'delivered' | 'failed', 
    details: any
  ): Promise<void> {
    try {
      // Get order details
      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        console.error(`Cannot send notification: Order ${orderId} not found`);
        return;
      }
      
      // Prepare notification data
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
      
      // Send notification to notification service
      try {
        await axios.post('http://notification-service:3005/api/notifications', notificationData);
        console.log(`Delivery ${status} notification sent for order ${orderId}`);
      } catch (error) {
        console.error(`Failed to send notification for order ${orderId}:`, error);
        
        // Broadcast via WebSocket as fallback
        this.webSocketManager.broadcastCriticalNotification({
          dispatchId,
          type: status === 'delivered' ? NotificationType.DELIVERY_EXCEPTION : NotificationType.DELIVERY_EXCEPTION,
          message: `Order ${orderId} ${status === 'delivered' ? 'delivered successfully' : 'delivery failed'}`,
          timestamp: new Date(),
          metadata: notificationData
        });
      }
    } catch (error) {
      console.error('Error sending delivery notifications:', error);
    }
  }
}
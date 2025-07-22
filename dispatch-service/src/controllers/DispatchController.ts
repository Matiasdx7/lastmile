import { Request, Response } from 'express';
import { DispatchService } from '../services/DispatchService';
import { Dispatch, DispatchStatus, Route, Location, OrderStatus, DeliveryStatus } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';
import { NotificationType } from '../services/WebSocketManager';

export class DispatchController {
  constructor(private dispatchService: DispatchService) {}

  /**
   * Create a new dispatch
   */
  async createDispatch(req: Request, res: Response): Promise<void> {
    try {
      const { routeId, vehicleId, driverId } = req.body;

      const dispatch = await this.dispatchService.createDispatch({
        id: uuidv4(),
        routeId,
        vehicleId,
        driverId,
        status: DispatchStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      res.status(201).json(dispatch);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get dispatch by ID
   */
  async getDispatch(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dispatch = await this.dispatchService.getDispatchById(id);

      if (!dispatch) {
        res.status(404).json({ error: 'Dispatch not found' });
        return;
      }

      res.status(200).json(dispatch);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all dispatches
   */
  async getAllDispatches(req: Request, res: Response): Promise<void> {
    try {
      const dispatches = await this.dispatchService.getAllDispatches();
      res.status(200).json(dispatches);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get active dispatches
   */
  async getActiveDispatches(req: Request, res: Response): Promise<void> {
    try {
      const dispatches = await this.dispatchService.getActiveDispatches();
      res.status(200).json(dispatches);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Confirm dispatch and update orders to "in transit"
   */
  async confirmDispatch(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dispatch = await this.dispatchService.confirmDispatch(id);

      if (!dispatch) {
        res.status(404).json({ error: 'Dispatch not found' });
        return;
      }

      res.status(200).json(dispatch);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get route summary for a dispatch
   */
  async getRouteSummary(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const routeSummary = await this.dispatchService.getRouteSummary(id);

      if (!routeSummary) {
        res.status(404).json({ error: 'Route summary not found' });
        return;
      }

      res.status(200).json(routeSummary);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Send route information to driver's mobile device
   */
  async sendRouteToDriver(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.dispatchService.sendRouteToDriver(id);

      if (!result) {
        res.status(404).json({ error: 'Dispatch not found' });
        return;
      }

      res.status(200).json({ message: 'Route sent to driver successfully', dispatchId: id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Get detailed route summary with vehicle, driver, and order information
   */
  async getDetailedRouteSummary(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const detailedSummary = await this.dispatchService.getDetailedRouteSummary(id);

      if (!detailedSummary) {
        res.status(404).json({ error: 'Detailed route summary not found' });
        return;
      }

      res.status(200).json(detailedSummary);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Confirm dispatch and send route to driver in a single operation
   * This endpoint handles the complete dispatch confirmation workflow
   */
  async confirmDispatchAndSendRoute(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Update dispatch status
   */
  async updateDispatchStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const dispatch = await this.dispatchService.updateDispatchStatus(id, status);

      if (!dispatch) {
        res.status(404).json({ error: 'Dispatch not found' });
        return;
      }

      res.status(200).json(dispatch);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
  
  /**
   * Update vehicle location for a dispatch
   * This endpoint receives location updates from the driver's mobile app
   */
  async updateVehicleLocation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { latitude, longitude, speed, heading } = req.body;
      
      if (!latitude || !longitude) {
        res.status(400).json({ error: 'Latitude and longitude are required' });
        return;
      }
      
      const location: Location = { latitude, longitude };
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
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
  
  /**
   * Get the current location for a dispatch
   */
  async getDispatchLocation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const location = await this.dispatchService.getDispatchLocation(id);
      
      if (!location) {
        res.status(404).json({ error: 'Location not found for this dispatch' });
        return;
      }
      
      res.status(200).json(location);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Send a critical notification for a dispatch
   */
  async sendCriticalNotification(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { type, message, metadata } = req.body;
      
      if (!type || !message) {
        res.status(400).json({ error: 'Notification type and message are required' });
        return;
      }
      
      // Validate notification type
      if (!Object.values(NotificationType).includes(type as NotificationType)) {
        res.status(400).json({ error: `Invalid notification type: ${type}` });
        return;
      }
      
      const result = await this.dispatchService.sendCriticalNotification(
        id, 
        type as NotificationType, 
        message, 
        metadata
      );
      
      if (!result) {
        res.status(404).json({ error: 'Dispatch not found' });
        return;
      }
      
      res.status(200).json({ 
        message: 'Critical notification sent successfully',
        dispatchId: id,
        notificationType: type
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
  
  /**
   * Detect and notify about potential delays for a dispatch
   * This endpoint would typically be called by a background job
   */
  async detectAndNotifyDelays(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.dispatchService.detectAndNotifyDelays(id);
      
      res.status(200).json({ 
        message: result ? 'Delay detected and notification sent' : 'No delays detected',
        dispatchId: id
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Record a successful delivery
   */
  async recordDeliverySuccess(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
  
  /**
   * Record a failed delivery attempt
   */
  async recordDeliveryFailure(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
  
  /**
   * Check if all deliveries in a route are completed
   */
  async checkRouteCompletion(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
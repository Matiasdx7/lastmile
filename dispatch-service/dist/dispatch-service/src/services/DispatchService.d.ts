import { Dispatch, DispatchStatus, Route, Location } from '../../../shared/types';
import { DispatchRepository } from '../../../shared/database/repositories/DispatchRepository';
import { RouteRepository } from '../../../shared/database/repositories/RouteRepository';
import { OrderRepository } from '../../../shared/database/repositories/OrderRepository';
import { VehicleRepository } from '../../../shared/database/repositories/VehicleRepository';
import { NotificationType } from './WebSocketManager';
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
export declare class DispatchService {
    private dispatchRepository;
    private routeRepository;
    private orderRepository;
    private vehicleRepository;
    private webSocketManager;
    constructor(dispatchRepository: DispatchRepository, routeRepository: RouteRepository, orderRepository: OrderRepository, vehicleRepository: VehicleRepository, webSocketPort?: number);
    createDispatch(dispatch: Dispatch): Promise<Dispatch>;
    getDispatchById(id: string): Promise<Dispatch | null>;
    getAllDispatches(): Promise<Dispatch[]>;
    getActiveDispatches(): Promise<Dispatch[]>;
    confirmDispatch(id: string): Promise<Dispatch | null>;
    getRouteSummary(dispatchId: string): Promise<RouteSummary | null>;
    getDetailedRouteSummary(dispatchId: string): Promise<DetailedRouteSummary | null>;
    sendRouteToDriver(dispatchId: string): Promise<boolean>;
    confirmDispatchAndSendRoute(id: string): Promise<{
        dispatch: Dispatch | null;
        routeSent: boolean;
    }>;
    updateDispatchStatus(id: string, status: DispatchStatus): Promise<Dispatch | null>;
    updateVehicleLocation(dispatchId: string, location: Location, speed?: number, heading?: number): Promise<boolean>;
    getDispatchLocation(dispatchId: string): Promise<Location | null>;
    sendCriticalNotification(dispatchId: string, type: NotificationType, message: string, metadata?: Record<string, any>): Promise<boolean>;
    detectAndNotifyDelays(dispatchId: string): Promise<boolean>;
    recordDeliverySuccess(stopId: string, orderId: string, proof: any): Promise<boolean>;
    recordDeliveryFailure(stopId: string, orderId: string, failureDetails: any): Promise<boolean>;
    checkRouteCompletion(dispatchId: string): Promise<{
        isCompleted: boolean;
        completedStops: number;
        totalStops: number;
        remainingStops: number;
    }>;
    sendDeliveryNotifications(orderId: string, dispatchId: string, status: 'delivered' | 'failed', details: any): Promise<void>;
}
export {};
//# sourceMappingURL=DispatchService.d.ts.map
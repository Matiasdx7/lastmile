import { Address } from '../common/Address';
import { RouteStatus } from '../enums/RouteStatus';
import { DeliveryStatus } from '../enums/DeliveryStatus';
export interface DeliveryProof {
    signature?: string;
    photo?: string;
    notes?: string;
    timestamp: Date;
}
export interface RouteStop {
    orderId: string;
    address: Address;
    sequence: number;
    estimatedArrival: Date;
    actualArrival?: Date;
    deliveryStatus?: DeliveryStatus;
    deliveryProof?: DeliveryProof;
}
export interface Route {
    id: string;
    loadId: string;
    vehicleId: string;
    stops: RouteStop[];
    totalDistance: number;
    estimatedDuration: number;
    status: RouteStatus;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Route.d.ts.map
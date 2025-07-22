import { DispatchStatus } from '../enums/DispatchStatus';
export interface Dispatch {
    id: string;
    routeId: string;
    vehicleId: string;
    driverId: string;
    status: DispatchStatus;
    startTime?: Date;
    completedTime?: Date;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Dispatch.d.ts.map
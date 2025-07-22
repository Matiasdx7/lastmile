import { LoadStatus } from '../enums/LoadStatus';
export interface Load {
    id: string;
    orders: string[];
    vehicleId?: string;
    totalWeight: number;
    totalVolume: number;
    status: LoadStatus;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Load.d.ts.map
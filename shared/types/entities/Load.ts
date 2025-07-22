import { LoadStatus } from '../enums/LoadStatus';

export interface Load {
  id: string;
  orders: string[]; // Order IDs
  vehicleId?: string;
  totalWeight: number;
  totalVolume: number;
  status: LoadStatus;
  createdAt: Date;
  updatedAt: Date;
}
import { Location } from '../common/Location';
import { VehicleStatus } from '../enums/VehicleStatus';
import { VehicleType } from '../enums/VehicleType';

export interface VehicleCapacity {
  maxWeight: number;
  maxVolume: number;
  maxPackages: number;
}

export interface Vehicle {
  id: string;
  licensePlate: string;
  type: VehicleType;
  capacity: VehicleCapacity;
  currentLocation?: Location;
  status: VehicleStatus;
  driverId?: string;
  createdAt: Date;
  updatedAt: Date;
}
import { Dimensions } from './Dimensions';

export interface Package {
  id: string;
  description: string;
  weight: number;
  dimensions: Dimensions;
  fragile: boolean;
}
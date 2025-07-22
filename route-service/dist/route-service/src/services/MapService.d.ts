import { Location } from '../../../shared/types';
export declare class MapService {
    getDirections(allWaypoints: Location[]): any;
    private apiKey;
    private mapsClient;
    constructor(apiKey: string);
    calculateDistanceMatrix(locations: Location[]): Promise<number[][]>;
    calculateTravelTime(origin: Location, destination: Location): Promise<number>;
}
//# sourceMappingURL=MapService.d.ts.map
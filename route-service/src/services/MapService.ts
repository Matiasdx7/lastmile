import axios from 'axios';
import { Client, DistanceMatrixResponse, TravelMode } from '@googlemaps/google-maps-services-js';
import { Location } from '../../../shared/types';


export class MapService {
  getDirections(allWaypoints: Location[]): any {
    throw new Error('Method not implemented.');
  }
  private apiKey: string;
  private mapsClient: Client;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.mapsClient = new Client({});
  }
  
  /**
   * Calculates a distance matrix between multiple locations
   * @returns Matrix of distances in kilometers
   */
  async calculateDistanceMatrix(locations: Location[]): Promise<number[][]> {
    try {
      if (locations.length === 0) {
        return [];
      }
      
      // Format locations for the API
      const origins = locations.map(loc => ({ lat: loc.latitude, lng: loc.longitude }));
      const destinations = origins; // Same locations for full matrix
      
      // Call Google Maps Distance Matrix API
      const response = await this.mapsClient.distancematrix({
        params: {
          origins,
          destinations,
          key: this.apiKey,
          mode: TravelMode.driving
        }
      });
      
      // Process response into a matrix
      const { rows } = response.data;
      return rows.map(row => 
        row.elements.map(element => element.distance.value / 1000) // Convert meters to kilometers
      );
    } catch (error) {
      console.error('Error calculating distance matrix:', error);
      throw new Error('Failed to calculate distances between locations');
    }
  }
  
  // ... rest of the file remains the same ...
  
  /**
   * Calculates the estimated travel time between two points
   * @returns Estimated travel time in minutes
   */
  async calculateTravelTime(origin: Location, destination: Location): Promise<number> {
    try {
      const response = await this.mapsClient.distancematrix({
        params: {
          origins: [{ lat: origin.latitude, lng: origin.longitude }],
          destinations: [{ lat: destination.latitude, lng: destination.longitude }],
          key: this.apiKey,
          mode: TravelMode.driving
        }
      });
      
      return response.data.rows[0].elements[0].duration.value / 60; // Convert seconds to minutes
    } catch (error) {
      console.error('Error calculating travel time:', error);
      throw new Error('Failed to calculate travel time between locations');
    }
  }
  
  // ... rest of the file remains the same ...
}

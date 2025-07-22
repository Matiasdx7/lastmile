// Mock data for the RoutePlanner component
export const mockRoute = {
  id: 'route-123',
  loadId: 'load-456',
  vehicleId: 'vehicle-789',
  status: 'PLANNED',
  totalDistance: 15000, // 15 km
  estimatedDuration: 3600, // 1 hour
  stops: [
    {
      orderId: 'order-1',
      address: {
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        coordinates: {
          latitude: 37.7749,
          longitude: -122.4194
        }
      },
      sequence: 0,
      estimatedArrival: new Date(Date.now() + 15 * 60000).toISOString() // 15 minutes from now
    },
    {
      orderId: 'order-2',
      address: {
        street: '456 Market St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        coordinates: {
          latitude: 37.7917,
          longitude: -122.4000
        }
      },
      sequence: 1,
      estimatedArrival: new Date(Date.now() + 30 * 60000).toISOString() // 30 minutes from now
    },
    {
      orderId: 'order-3',
      address: {
        street: '789 Howard St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        coordinates: {
          latitude: 37.7850,
          longitude: -122.4100
        }
      },
      sequence: 2,
      estimatedArrival: new Date(Date.now() + 45 * 60000).toISOString() // 45 minutes from now
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const mockMapData = {
  polyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
  waypoints: mockRoute.stops.map(stop => ({
    location: stop.address.coordinates,
    orderId: stop.orderId,
    sequence: stop.sequence,
    estimatedArrival: stop.estimatedArrival
  }))
};

// Mock time window conflicts
export const mockTimeWindowConflicts = [
  'Stop for order order-1: Estimated arrival at 10:15 AM is before the time window starts at 10:30 AM'
];

// Function to reorder stops and recalculate times
export const reorderStops = (stops: any[], stopOrder: string[]) => {
  // Create a map of orderId to stop for easy lookup
  const stopMap = new Map(stops.map(stop => [stop.orderId, stop]));
  
  // Create new stops array with updated sequence
  const reorderedStops = stopOrder.map((orderId, index) => {
    const stop = stopMap.get(orderId);
    if (!stop) {
      throw new Error(`Stop with orderId ${orderId} not found`);
    }
    
    // Calculate new estimated arrival time (simplified)
    // In a real app, this would be calculated based on distances and travel times
    const newEstimatedArrival = new Date(Date.now() + (index + 1) * 15 * 60000).toISOString();
    
    return {
      ...stop,
      sequence: index,
      estimatedArrival: newEstimatedArrival
    };
  });
  
  return reorderedStops;
};
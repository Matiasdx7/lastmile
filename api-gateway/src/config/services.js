// Service configuration
const services = {
  auth: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3007',
    routes: ['/api/auth'],
    public: true
  },
  order: {
    url: process.env.ORDER_SERVICE_URL || 'http://localhost:3001',
    routes: ['/api/orders'],
    public: false
  },
  vehicle: {
    url: process.env.VEHICLE_SERVICE_URL || 'http://localhost:3002',
    routes: ['/api/vehicles'],
    public: false
  },
  route: {
    url: process.env.ROUTE_SERVICE_URL || 'http://localhost:3003',
    routes: ['/api/routes'],
    public: false
  },
  dispatch: {
    url: process.env.DISPATCH_SERVICE_URL || 'http://localhost:3004',
    routes: ['/api/dispatch'],
    public: false
  },
  notification: {
    url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005',
    routes: ['/api/notifications'],
    public: false
  },
  bpm: {
    url: process.env.BPM_SERVICE_URL || 'http://localhost:3006',
    routes: ['/api/bpm'],
    public: false
  }
};

// Get public routes that don't require authentication
const getPublicRoutes = () => {
  const publicRoutes = [];
  
  Object.values(services).forEach(service => {
    if (service.public) {
      service.routes.forEach(route => {
        publicRoutes.push(route);
      });
    }
  });
  
  return publicRoutes;
};

module.exports = {
  services,
  getPublicRoutes
};
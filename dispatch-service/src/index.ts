import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { createDispatchRoutes } from './routes/dispatchRoutes';
import { DispatchController } from './controllers/DispatchController';
import { DispatchService } from './services/DispatchService';
import { DispatchRepository } from '../../shared/database/repositories/DispatchRepository';
import { RouteRepository } from '../../shared/database/repositories/RouteRepository';
import { OrderRepository } from '../../shared/database/repositories/OrderRepository';
import { VehicleRepository } from '../../shared/database/repositories/VehicleRepository';
import { DispatchValidator } from './validators/DispatchValidator';

// Load environment variables
dotenv.config();

// Create database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize repositories
const dispatchRepository = new DispatchRepository(pool);
const routeRepository = new RouteRepository(pool);
const orderRepository = new OrderRepository(pool);
const vehicleRepository = new VehicleRepository(pool);

// Initialize services
const dispatchService = new DispatchService(
  dispatchRepository,
  routeRepository,
  orderRepository,
  vehicleRepository
);

// Initialize controllers
const dispatchController = new DispatchController(dispatchService);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/dispatch', createDispatchRoutes(dispatchController));

// Add validators to routes
app.post('/api/dispatch', DispatchValidator.validateCreateDispatch);
app.put('/api/dispatch/:id/status', DispatchValidator.validateUpdateStatus);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Dispatch service running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

export default app;
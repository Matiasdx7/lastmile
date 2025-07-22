import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { createVehicleRouter } from './routes/vehicleRoutes';
import { createVehicleAssignmentRouter } from './routes/vehicleAssignmentRoutes';
import { VehicleController } from './controllers/VehicleController';
import { VehicleAssignmentController } from './controllers/VehicleAssignmentController';
import { VehicleService } from './services/VehicleService';
import { VehicleAssignmentService } from './services/VehicleAssignmentService';
import { VehicleValidator } from './validators/VehicleValidator';
import { VehicleRepository } from '../../shared/database/repositories/VehicleRepository';
import { LoadRepository } from '../../shared/database/repositories/LoadRepository';

// Load environment variables
dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize repositories, services, and controllers
const vehicleRepository = new VehicleRepository(pool);
const loadRepository = new LoadRepository(pool);
const vehicleValidator = new VehicleValidator();
const vehicleService = new VehicleService(vehicleRepository, vehicleValidator);
const vehicleAssignmentService = new VehicleAssignmentService(vehicleRepository, loadRepository);
const vehicleController = new VehicleController(vehicleService);
const vehicleAssignmentController = new VehicleAssignmentController(vehicleAssignmentService);

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    service: 'vehicle-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Vehicle Service API',
    version: '1.0.0'
  });
});

// API routes
app.use('/api/vehicles', createVehicleRouter(vehicleController));
app.use('/api/assignments', createVehicleAssignmentRouter(vehicleAssignmentController));

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    }
  });
});

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Vehicle Service running on port ${PORT}`);
  });
}

export default app;
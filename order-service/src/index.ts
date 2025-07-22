import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { DatabaseConnection, getDatabaseConfigFromEnv, getRedisConfigFromEnv } from '../../shared/database/connection';
import { createOrderRouter } from './routes/orderRoutes';
import { errorHandler } from './middleware/errorHandler';
import { RedisClientType } from 'redis';
import { setupSwagger } from './utils/swagger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database connection
const dbConnection = DatabaseConnection.getInstance();
let dbPool: any;
let redisClient: RedisClientType | null = null;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    service: 'order-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Order Service API',
    version: '1.0.0'
  });
});

// Initialize database and routes
const initializeApp = async () => {
  try {
    // Initialize database connection
    dbPool = await dbConnection.initializePostgreSQL(getDatabaseConfigFromEnv());
    
    // Initialize Redis connection if enabled
    if (process.env.REDIS_ENABLED === 'true') {
      try {
        redisClient = await dbConnection.initializeRedis(getRedisConfigFromEnv());
        console.log('Redis connection established successfully');
      } catch (redisError) {
        console.warn('Failed to connect to Redis, continuing without caching:', redisError);
        redisClient = null;
      }
    }
    
    // Setup Swagger documentation
    setupSwagger(app);
    
    // Register routes
    app.use('/api/orders', createOrderRouter(dbPool, redisClient));
    
    // Error handling middleware (must be registered after routes)
    app.use(errorHandler);
    
    console.log('Order Service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Order Service:', error);
    process.exit(1);
  }
};

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  initializeApp().then(() => {
    app.listen(PORT, () => {
      console.log(`Order Service running on port ${PORT}`);
    });
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down Order Service...');
  try {
    await dbConnection.closeConnections();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

export default app;
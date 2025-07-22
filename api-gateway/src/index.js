const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import middleware
const { authMiddleware } = require('./middleware/authMiddleware');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS support
app.use(express.json()); // Parse JSON bodies
app.use(requestLogger(logger)); // Request logging

// Rate limiting
const limiter = rateLimit({
  windowMs: eval(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too many requests, please try again later.'
  }
});

// Apply rate limiting to all requests
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Import routes
const authRoutes = require('./routes/authRoutes');

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes - Apply authentication middleware
app.use('/api', authMiddleware);

// Service proxies
// Order Service
app.use('/api/orders', createProxyMiddleware({
  target: process.env.ORDER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/orders': '/api/orders' },
  logLevel: 'error',
  onError: (err, req, res) => {
    logger.error(`Order Service Proxy Error: ${err.message}`);
    res.status(500).json({ error: 'Order service unavailable' });
  }
}));

// Vehicle Service
app.use('/api/vehicles', createProxyMiddleware({
  target: process.env.VEHICLE_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/vehicles': '/api/vehicles' },
  logLevel: 'error',
  onError: (err, req, res) => {
    logger.error(`Vehicle Service Proxy Error: ${err.message}`);
    res.status(500).json({ error: 'Vehicle service unavailable' });
  }
}));

// Route Service
app.use('/api/routes', createProxyMiddleware({
  target: process.env.ROUTE_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/routes': '/api/routes' },
  logLevel: 'error',
  onError: (err, req, res) => {
    logger.error(`Route Service Proxy Error: ${err.message}`);
    res.status(500).json({ error: 'Route service unavailable' });
  }
}));

// Dispatch Service
app.use('/api/dispatch', createProxyMiddleware({
  target: process.env.DISPATCH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/dispatch': '/api/dispatch' },
  logLevel: 'error',
  onError: (err, req, res) => {
    logger.error(`Dispatch Service Proxy Error: ${err.message}`);
    res.status(500).json({ error: 'Dispatch service unavailable' });
  }
}));

// BPM Service
app.use('/api/bpm', createProxyMiddleware({
  target: process.env.BPM_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/bpm': '/api/bpm' },
  logLevel: 'error',
  onError: (err, req, res) => {
    logger.error(`BPM Service Proxy Error: ${err.message}`);
    res.status(500).json({ error: 'BPM service unavailable' });
  }
}));

// Notification Service
app.use('/api/notifications', createProxyMiddleware({
  target: process.env.NOTIFICATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/notifications': '/api/notifications' },
  logLevel: 'error',
  onError: (err, req, res) => {
    logger.error(`Notification Service Proxy Error: ${err.message}`);
    res.status(500).json({ error: 'Notification service unavailable' });
  }
}));

// Error handling middleware
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  console.log(`API Gateway running on port ${PORT}`);
});

module.exports = app; // For testing purposes
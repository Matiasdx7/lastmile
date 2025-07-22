const winston = require('winston');

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

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  // Generate unique error ID for tracking
  const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  // Log error details
  logger.error({
    errorId,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.auth?.userId || 'unauthenticated'
  });

  // Handle JWT authentication errors
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
        errorId
      }
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.details || err.message,
        errorId
      }
    });
  }

  // Handle not found errors
  if (err.statusCode === 404 || err.name === 'NotFoundError') {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: err.message || 'Resource not found',
        errorId
      }
    });
  }

  // Handle conflict errors
  if (err.statusCode === 409 || err.name === 'ConflictError') {
    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: err.message || 'Resource conflict',
        errorId
      }
    });
  }

  // Default to 500 server error
  res.status(err.statusCode || 500).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message || 'Internal server error',
      errorId
    }
  });
};

module.exports = {
  errorHandler
};
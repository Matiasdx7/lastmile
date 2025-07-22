// Request logging middleware
const requestLogger = (logger) => {
  return (req, res, next) => {
    const start = Date.now();
    
    // Log request details
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // Add request ID to response headers for tracking
    res.setHeader('X-Request-ID', requestId);
    
    // Store request ID in request object for later use
    req.requestId = requestId;
    
    // Log when request is received
    logger.info({
      type: 'request',
      requestId,
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      userId: req.auth?.userId || 'unauthenticated'
    });
    
    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - start;
      const level = res.statusCode >= 400 ? 'warn' : 'info';
      
      logger[level]({
        type: 'response',
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userId: req.auth?.userId || 'unauthenticated'
      });
    });
    
    next();
  };
};

module.exports = {
  requestLogger
};
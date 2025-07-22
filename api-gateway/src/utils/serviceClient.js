const axios = require('axios');
const CircuitBreaker = require('opossum');
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

// Circuit breaker options
const circuitOptions = {
  timeout: 5000, // If our function takes longer than 5 seconds, trigger a failure
  errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
  resetTimeout: 30000, // After 30 seconds, try again
  rollingCountTimeout: 10000, // Sets the duration of the statistical rolling window
  rollingCountBuckets: 10 // Sets the number of buckets the rolling window is divided into
};

/**
 * Creates a circuit breaker wrapped HTTP client for service-to-service communication
 * @param {string} serviceName - Name of the service for logging
 * @param {string} baseURL - Base URL of the service
 * @returns {Object} - HTTP client with circuit breaker
 */
function createServiceClient(serviceName, baseURL) {
  // Create axios instance
  const client = axios.create({
    baseURL,
    timeout: 5000,
    headers: {
      'Content-Type': 'application/json',
      'X-Service-Name': 'api-gateway'
    }
  });

  // Add request interceptor for logging
  client.interceptors.request.use(
    config => {
      logger.debug(`Request to ${serviceName}: ${config.method.toUpperCase()} ${config.url}`);
      return config;
    },
    error => {
      logger.error(`Request error to ${serviceName}:`, error);
      return Promise.reject(error);
    }
  );

  // Add response interceptor for logging
  client.interceptors.response.use(
    response => {
      logger.debug(`Response from ${serviceName}: ${response.status}`);
      return response;
    },
    error => {
      if (error.response) {
        logger.error(`Error response from ${serviceName}: ${error.response.status}`, {
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        logger.error(`No response from ${serviceName}:`, error.request);
      } else {
        logger.error(`Error in request to ${serviceName}:`, error.message);
      }
      return Promise.reject(error);
    }
  );

  // Create circuit breaker wrapped functions
  const get = new CircuitBreaker(
    async (url, config) => client.get(url, config),
    circuitOptions
  );

  const post = new CircuitBreaker(
    async (url, data, config) => client.post(url, data, config),
    circuitOptions
  );

  const put = new CircuitBreaker(
    async (url, data, config) => client.put(url, data, config),
    circuitOptions
  );

  const del = new CircuitBreaker(
    async (url, config) => client.delete(url, config),
    circuitOptions
  );

  // Add event listeners for circuit state changes
  [get, post, put, del].forEach(breaker => {
    breaker.on('open', () => {
      logger.warn(`Circuit breaker for ${serviceName} opened`);
    });

    breaker.on('close', () => {
      logger.info(`Circuit breaker for ${serviceName} closed`);
    });

    breaker.on('halfOpen', () => {
      logger.info(`Circuit breaker for ${serviceName} half-open`);
    });

    breaker.on('fallback', () => {
      logger.warn(`Fallback for ${serviceName} executed`);
    });
  });

  return {
    get: (url, config) => get.fire(url, config),
    post: (url, data, config) => post.fire(url, data, config),
    put: (url, data, config) => put.fire(url, data, config),
    delete: (url, config) => del.fire(url, config),
    getCircuitState: () => ({
      get: get.status,
      post: post.status,
      put: put.status,
      delete: del.status
    })
  };
}

module.exports = {
  createServiceClient
};
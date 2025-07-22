import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import path from 'path';

// Import shared Swagger configuration
const sharedSwaggerOptions = require('../../../shared/swagger/swagger-config');

// Extend the shared options with service-specific settings
const options = {
  ...sharedSwaggerOptions,
  definition: {
    ...sharedSwaggerOptions.definition,
    info: {
      ...sharedSwaggerOptions.definition.info,
      title: 'Order Service API',
      description: 'API documentation for the Order Service of the Last Mile Delivery System'
    },
    servers: [
      {
        url: process.env.SERVICE_URL || 'http://localhost:3001',
        description: 'Order Service'
      }
    ]
  },
  // Include all route files and model files
  apis: [
    path.resolve(__dirname, '../routes/*.ts'),
    path.resolve(__dirname, '../../../shared/types/entities/*.ts'),
    path.resolve(__dirname, '../../../shared/types/enums/*.ts'),
    path.resolve(__dirname, '../../../shared/types/common/*.ts')
  ]
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Order Service API Documentation'
  }));
};
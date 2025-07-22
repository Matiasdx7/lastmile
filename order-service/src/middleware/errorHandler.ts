import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// Validation error class
export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(400, message, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

// Not found error class
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(404, message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Generate a unique request ID for tracking
  const requestId = uuidv4();

  // Handle ApiError instances
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.statusCode.toString(),
        message: err.message,
        details: err.details,
        timestamp: new Date().toISOString(),
        requestId
      }
    });
  }

  // Handle other errors as 500 Internal Server Error
  return res.status(500).json({
    error: {
      code: '500',
      message: 'Internal Server Error',
      timestamp: new Date().toISOString(),
      requestId
    }
  });
};
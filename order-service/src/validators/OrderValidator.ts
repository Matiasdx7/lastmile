import Joi from 'joi';
import { ValidationError } from '../middleware/errorHandler';
import { OrderStatus } from '../../../shared/types/enums/OrderStatus';

// Schema for Location
const locationSchema = Joi.object({
  latitude: Joi.number().required().min(-90).max(90)
    .messages({
      'number.base': 'Latitude must be a number',
      'number.min': 'Latitude must be at least -90 degrees',
      'number.max': 'Latitude must be at most 90 degrees',
      'any.required': 'Latitude is required'
    }),
  longitude: Joi.number().required().min(-180).max(180)
    .messages({
      'number.base': 'Longitude must be a number',
      'number.min': 'Longitude must be at least -180 degrees',
      'number.max': 'Longitude must be at most 180 degrees',
      'any.required': 'Longitude is required'
    })
});

// Schema for Address
const addressSchema = Joi.object({
  street: Joi.string().required().trim().max(255)
    .messages({
      'string.base': 'Street must be a string',
      'string.empty': 'Street cannot be empty',
      'string.max': 'Street cannot exceed 255 characters',
      'any.required': 'Street is required'
    }),
  city: Joi.string().required().trim().max(100)
    .messages({
      'string.base': 'City must be a string',
      'string.empty': 'City cannot be empty',
      'string.max': 'City cannot exceed 100 characters',
      'any.required': 'City is required'
    }),
  state: Joi.string().required().trim().max(100)
    .messages({
      'string.base': 'State must be a string',
      'string.empty': 'State cannot be empty',
      'string.max': 'State cannot exceed 100 characters',
      'any.required': 'State is required'
    }),
  zipCode: Joi.string().required().trim().max(20).pattern(/^[0-9a-zA-Z\s-]+$/)
    .messages({
      'string.base': 'Zip code must be a string',
      'string.empty': 'Zip code cannot be empty',
      'string.max': 'Zip code cannot exceed 20 characters',
      'string.pattern.base': 'Zip code format is invalid',
      'any.required': 'Zip code is required'
    }),
  coordinates: locationSchema.required()
    .messages({
      'any.required': 'Coordinates are required'
    })
});

// Schema for Dimensions
const dimensionsSchema = Joi.object({
  length: Joi.number().required().positive().precision(2)
    .messages({
      'number.base': 'Length must be a number',
      'number.positive': 'Length must be positive',
      'any.required': 'Length is required'
    }),
  width: Joi.number().required().positive().precision(2)
    .messages({
      'number.base': 'Width must be a number',
      'number.positive': 'Width must be positive',
      'any.required': 'Width is required'
    }),
  height: Joi.number().required().positive().precision(2)
    .messages({
      'number.base': 'Height must be a number',
      'number.positive': 'Height must be positive',
      'any.required': 'Height is required'
    })
});

// Schema for Package
const packageSchema = Joi.object({
  id: Joi.string().optional(),
  description: Joi.string().required().trim().max(255)
    .messages({
      'string.base': 'Description must be a string',
      'string.empty': 'Description cannot be empty',
      'string.max': 'Description cannot exceed 255 characters',
      'any.required': 'Description is required'
    }),
  weight: Joi.number().required().positive().precision(2)
    .messages({
      'number.base': 'Weight must be a number',
      'number.positive': 'Weight must be positive',
      'any.required': 'Weight is required'
    }),
  dimensions: dimensionsSchema.required()
    .messages({
      'any.required': 'Dimensions are required'
    }),
  fragile: Joi.boolean().required()
    .messages({
      'boolean.base': 'Fragile must be a boolean',
      'any.required': 'Fragile indicator is required'
    })
});

// Schema for TimeWindow
const timeWindowSchema = Joi.object({
  startTime: Joi.date().iso().required()
    .messages({
      'date.base': 'Start time must be a valid date',
      'date.format': 'Start time must be in ISO format',
      'any.required': 'Start time is required'
    }),
  endTime: Joi.date().iso().required().greater(Joi.ref('startTime'))
    .messages({
      'date.base': 'End time must be a valid date',
      'date.format': 'End time must be in ISO format',
      'date.greater': 'End time must be after start time',
      'any.required': 'End time is required'
    })
});

// Schema for creating a new order
export const createOrderSchema = Joi.object({
  customerId: Joi.string().required().trim().max(100)
    .messages({
      'string.base': 'Customer ID must be a string',
      'string.empty': 'Customer ID cannot be empty',
      'string.max': 'Customer ID cannot exceed 100 characters',
      'any.required': 'Customer ID is required'
    }),
  customerName: Joi.string().required().trim().max(255)
    .messages({
      'string.base': 'Customer name must be a string',
      'string.empty': 'Customer name cannot be empty',
      'string.max': 'Customer name cannot exceed 255 characters',
      'any.required': 'Customer name is required'
    }),
  customerPhone: Joi.string().required().pattern(/^\+?[0-9]{10,15}$/)
    .messages({
      'string.base': 'Customer phone must be a string',
      'string.empty': 'Customer phone cannot be empty',
      'string.pattern.base': 'Customer phone format is invalid (should be 10-15 digits with optional + prefix)',
      'any.required': 'Customer phone is required'
    }),
  deliveryAddress: addressSchema.required()
    .messages({
      'any.required': 'Delivery address is required'
    }),
  packageDetails: Joi.array().items(packageSchema).min(1).required()
    .messages({
      'array.base': 'Package details must be an array',
      'array.min': 'At least one package is required',
      'any.required': 'Package details are required'
    }),
  specialInstructions: Joi.string().optional().allow('').max(1000)
    .messages({
      'string.base': 'Special instructions must be a string',
      'string.max': 'Special instructions cannot exceed 1000 characters'
    }),
  timeWindow: timeWindowSchema.optional()
});

// Schema for updating an existing order
export const updateOrderSchema = Joi.object({
  customerName: Joi.string().optional().trim().max(255)
    .messages({
      'string.base': 'Customer name must be a string',
      'string.max': 'Customer name cannot exceed 255 characters'
    }),
  customerPhone: Joi.string().optional().pattern(/^\+?[0-9]{10,15}$/)
    .messages({
      'string.base': 'Customer phone must be a string',
      'string.pattern.base': 'Customer phone format is invalid (should be 10-15 digits with optional + prefix)'
    }),
  deliveryAddress: addressSchema.optional(),
  packageDetails: Joi.array().items(packageSchema).min(1).optional()
    .messages({
      'array.base': 'Package details must be an array',
      'array.min': 'At least one package is required'
    }),
  specialInstructions: Joi.string().optional().allow('').max(1000)
    .messages({
      'string.base': 'Special instructions must be a string',
      'string.max': 'Special instructions cannot exceed 1000 characters'
    }),
  timeWindow: timeWindowSchema.optional(),
  status: Joi.string().optional().valid(...Object.values(OrderStatus))
    .messages({
      'string.base': 'Status must be a string',
      'any.only': `Status must be one of: ${Object.values(OrderStatus).join(', ')}`
    })
});

// Validator functions
export class OrderValidator {
  // Keywords that might indicate special handling is needed
  static readonly SPECIAL_KEYWORDS = [
    'fragile', 'urgent', 'priority', 'handle with care', 'special', 
    'custom', 'refrigerated', 'perishable', 'valuable', 'sensitive',
    'breakable', 'delicate', 'frágil', 'urgente', 'prioritario'
  ];

  // Validate order creation data
  static validateCreate(data: any): void {
    const { error } = createOrderSchema.validate(data, { 
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      throw new ValidationError('Invalid order data', this.formatJoiErrors(error));
    }
    
    // Additional business rule validations
    this.validateBusinessRules(data);
  }

  // Validate order update data
  static validateUpdate(data: any): void {
    const { error } = updateOrderSchema.validate(data, { 
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      throw new ValidationError('Invalid order update data', this.formatJoiErrors(error));
    }
    
    // Additional business rule validations for updates
    if (Object.keys(data).length > 0) {
      this.validateBusinessRules(data, true);
    }
  }

  // Validate UUID format
  static validateId(id: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new ValidationError('Invalid order ID format');
    }
  }

  // Check if special instructions need manual review
  static needsManualReview(data: any): boolean {
    // Check special instructions for keywords
    if (data.specialInstructions) {
      const instructions = data.specialInstructions.toLowerCase();
      return this.SPECIAL_KEYWORDS.some(keyword => 
        instructions.includes(keyword.toLowerCase())
      );
    }
    
    // Check for large or heavy packages
    if (data.packageDetails && data.packageDetails.length > 0) {
      return data.packageDetails.some((pkg: any) => 
        pkg.weight > 50 || // Weight over 50 kg
        (pkg.dimensions && 
          (pkg.dimensions.length > 200 || 
           pkg.dimensions.width > 200 || 
           pkg.dimensions.height > 200)) || // Any dimension over 200 cm
        pkg.fragile // Fragile packages
      );
    }
    
    return false;
  }

  // Additional business rule validations
  private static validateBusinessRules(data: any, isUpdate: boolean = false): void {
    const errors: Record<string, string> = {};
    
    // Validate time window is in the future (for new orders or when updating time window)
    if (data.timeWindow && !isUpdate) {
      const now = new Date();
      const startTime = new Date(data.timeWindow.startTime);
      
      if (startTime < now) {
        errors['timeWindow.startTime'] = 'Delivery time window must be in the future';
      }
    }
    
    // Validate package weight limits
    if (data.packageDetails) {
      data.packageDetails.forEach((pkg: any, index: number) => {
        if (pkg.weight > 500) { // Example max weight limit
          errors[`packageDetails[${index}].weight`] = 'Package weight exceeds maximum limit of 500 kg';
        }
        
        // Calculate volume and check if it's reasonable
        if (pkg.dimensions) {
          const volume = pkg.dimensions.length * pkg.dimensions.width * pkg.dimensions.height;
          if (volume > 8000000) { // 8 cubic meters (example limit)
            errors[`packageDetails[${index}].dimensions`] = 'Package dimensions exceed maximum volume limit';
          }
        }
      });
    }
    
    // If any business rule violations were found, throw validation error
    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Business rule violations', errors);
    }
  }

  // Helper to format Joi validation errors
  private static formatJoiErrors(error: Joi.ValidationError): any {
    return error.details.reduce((acc: any, curr) => {
      const key = curr.path.join('.');
      acc[key] = curr.message;
      return acc;
    }, {});
  }
}
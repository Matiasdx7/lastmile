"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderValidator = exports.updateOrderSchema = exports.createOrderSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const errorHandler_1 = require("../middleware/errorHandler");
const OrderStatus_1 = require("../../../shared/types/enums/OrderStatus");
const locationSchema = joi_1.default.object({
    latitude: joi_1.default.number().required().min(-90).max(90)
        .messages({
        'number.base': 'Latitude must be a number',
        'number.min': 'Latitude must be at least -90 degrees',
        'number.max': 'Latitude must be at most 90 degrees',
        'any.required': 'Latitude is required'
    }),
    longitude: joi_1.default.number().required().min(-180).max(180)
        .messages({
        'number.base': 'Longitude must be a number',
        'number.min': 'Longitude must be at least -180 degrees',
        'number.max': 'Longitude must be at most 180 degrees',
        'any.required': 'Longitude is required'
    })
});
const addressSchema = joi_1.default.object({
    street: joi_1.default.string().required().trim().max(255)
        .messages({
        'string.base': 'Street must be a string',
        'string.empty': 'Street cannot be empty',
        'string.max': 'Street cannot exceed 255 characters',
        'any.required': 'Street is required'
    }),
    city: joi_1.default.string().required().trim().max(100)
        .messages({
        'string.base': 'City must be a string',
        'string.empty': 'City cannot be empty',
        'string.max': 'City cannot exceed 100 characters',
        'any.required': 'City is required'
    }),
    state: joi_1.default.string().required().trim().max(100)
        .messages({
        'string.base': 'State must be a string',
        'string.empty': 'State cannot be empty',
        'string.max': 'State cannot exceed 100 characters',
        'any.required': 'State is required'
    }),
    zipCode: joi_1.default.string().required().trim().max(20).pattern(/^[0-9a-zA-Z\s-]+$/)
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
const dimensionsSchema = joi_1.default.object({
    length: joi_1.default.number().required().positive().precision(2)
        .messages({
        'number.base': 'Length must be a number',
        'number.positive': 'Length must be positive',
        'any.required': 'Length is required'
    }),
    width: joi_1.default.number().required().positive().precision(2)
        .messages({
        'number.base': 'Width must be a number',
        'number.positive': 'Width must be positive',
        'any.required': 'Width is required'
    }),
    height: joi_1.default.number().required().positive().precision(2)
        .messages({
        'number.base': 'Height must be a number',
        'number.positive': 'Height must be positive',
        'any.required': 'Height is required'
    })
});
const packageSchema = joi_1.default.object({
    id: joi_1.default.string().optional(),
    description: joi_1.default.string().required().trim().max(255)
        .messages({
        'string.base': 'Description must be a string',
        'string.empty': 'Description cannot be empty',
        'string.max': 'Description cannot exceed 255 characters',
        'any.required': 'Description is required'
    }),
    weight: joi_1.default.number().required().positive().precision(2)
        .messages({
        'number.base': 'Weight must be a number',
        'number.positive': 'Weight must be positive',
        'any.required': 'Weight is required'
    }),
    dimensions: dimensionsSchema.required()
        .messages({
        'any.required': 'Dimensions are required'
    }),
    fragile: joi_1.default.boolean().required()
        .messages({
        'boolean.base': 'Fragile must be a boolean',
        'any.required': 'Fragile indicator is required'
    })
});
const timeWindowSchema = joi_1.default.object({
    startTime: joi_1.default.date().iso().required()
        .messages({
        'date.base': 'Start time must be a valid date',
        'date.format': 'Start time must be in ISO format',
        'any.required': 'Start time is required'
    }),
    endTime: joi_1.default.date().iso().required().greater(joi_1.default.ref('startTime'))
        .messages({
        'date.base': 'End time must be a valid date',
        'date.format': 'End time must be in ISO format',
        'date.greater': 'End time must be after start time',
        'any.required': 'End time is required'
    })
});
exports.createOrderSchema = joi_1.default.object({
    customerId: joi_1.default.string().required().trim().max(100)
        .messages({
        'string.base': 'Customer ID must be a string',
        'string.empty': 'Customer ID cannot be empty',
        'string.max': 'Customer ID cannot exceed 100 characters',
        'any.required': 'Customer ID is required'
    }),
    customerName: joi_1.default.string().required().trim().max(255)
        .messages({
        'string.base': 'Customer name must be a string',
        'string.empty': 'Customer name cannot be empty',
        'string.max': 'Customer name cannot exceed 255 characters',
        'any.required': 'Customer name is required'
    }),
    customerPhone: joi_1.default.string().required().pattern(/^\+?[0-9]{10,15}$/)
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
    packageDetails: joi_1.default.array().items(packageSchema).min(1).required()
        .messages({
        'array.base': 'Package details must be an array',
        'array.min': 'At least one package is required',
        'any.required': 'Package details are required'
    }),
    specialInstructions: joi_1.default.string().optional().allow('').max(1000)
        .messages({
        'string.base': 'Special instructions must be a string',
        'string.max': 'Special instructions cannot exceed 1000 characters'
    }),
    timeWindow: timeWindowSchema.optional()
});
exports.updateOrderSchema = joi_1.default.object({
    customerName: joi_1.default.string().optional().trim().max(255)
        .messages({
        'string.base': 'Customer name must be a string',
        'string.max': 'Customer name cannot exceed 255 characters'
    }),
    customerPhone: joi_1.default.string().optional().pattern(/^\+?[0-9]{10,15}$/)
        .messages({
        'string.base': 'Customer phone must be a string',
        'string.pattern.base': 'Customer phone format is invalid (should be 10-15 digits with optional + prefix)'
    }),
    deliveryAddress: addressSchema.optional(),
    packageDetails: joi_1.default.array().items(packageSchema).min(1).optional()
        .messages({
        'array.base': 'Package details must be an array',
        'array.min': 'At least one package is required'
    }),
    specialInstructions: joi_1.default.string().optional().allow('').max(1000)
        .messages({
        'string.base': 'Special instructions must be a string',
        'string.max': 'Special instructions cannot exceed 1000 characters'
    }),
    timeWindow: timeWindowSchema.optional(),
    status: joi_1.default.string().optional().valid(...Object.values(OrderStatus_1.OrderStatus))
        .messages({
        'string.base': 'Status must be a string',
        'any.only': `Status must be one of: ${Object.values(OrderStatus_1.OrderStatus).join(', ')}`
    })
});
class OrderValidator {
    static validateCreate(data) {
        const { error } = exports.createOrderSchema.validate(data, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            throw new errorHandler_1.ValidationError('Invalid order data', this.formatJoiErrors(error));
        }
        this.validateBusinessRules(data);
    }
    static validateUpdate(data) {
        const { error } = exports.updateOrderSchema.validate(data, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            throw new errorHandler_1.ValidationError('Invalid order update data', this.formatJoiErrors(error));
        }
        if (Object.keys(data).length > 0) {
            this.validateBusinessRules(data, true);
        }
    }
    static validateId(id) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            throw new errorHandler_1.ValidationError('Invalid order ID format');
        }
    }
    static needsManualReview(data) {
        if (data.specialInstructions) {
            const instructions = data.specialInstructions.toLowerCase();
            return this.SPECIAL_KEYWORDS.some(keyword => instructions.includes(keyword.toLowerCase()));
        }
        if (data.packageDetails && data.packageDetails.length > 0) {
            return data.packageDetails.some((pkg) => pkg.weight > 50 ||
                (pkg.dimensions &&
                    (pkg.dimensions.length > 200 ||
                        pkg.dimensions.width > 200 ||
                        pkg.dimensions.height > 200)) ||
                pkg.fragile);
        }
        return false;
    }
    static validateBusinessRules(data, isUpdate = false) {
        const errors = {};
        if (data.timeWindow && !isUpdate) {
            const now = new Date();
            const startTime = new Date(data.timeWindow.startTime);
            if (startTime < now) {
                errors['timeWindow.startTime'] = 'Delivery time window must be in the future';
            }
        }
        if (data.packageDetails) {
            data.packageDetails.forEach((pkg, index) => {
                if (pkg.weight > 500) {
                    errors[`packageDetails[${index}].weight`] = 'Package weight exceeds maximum limit of 500 kg';
                }
                if (pkg.dimensions) {
                    const volume = pkg.dimensions.length * pkg.dimensions.width * pkg.dimensions.height;
                    if (volume > 8000000) {
                        errors[`packageDetails[${index}].dimensions`] = 'Package dimensions exceed maximum volume limit';
                    }
                }
            });
        }
        if (Object.keys(errors).length > 0) {
            throw new errorHandler_1.ValidationError('Business rule violations', errors);
        }
    }
    static formatJoiErrors(error) {
        return error.details.reduce((acc, curr) => {
            const key = curr.path.join('.');
            acc[key] = curr.message;
            return acc;
        }, {});
    }
}
exports.OrderValidator = OrderValidator;
OrderValidator.SPECIAL_KEYWORDS = [
    'fragile', 'urgent', 'priority', 'handle with care', 'special',
    'custom', 'refrigerated', 'perishable', 'valuable', 'sensitive',
    'breakable', 'delicate', 'frágil', 'urgente', 'prioritario'
];
//# sourceMappingURL=OrderValidator.js.map
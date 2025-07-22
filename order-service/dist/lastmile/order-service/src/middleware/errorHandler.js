"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.NotFoundError = exports.ValidationError = exports.ApiError = void 0;
const uuid_1 = require("uuid");
class ApiError extends Error {
    constructor(statusCode, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}
exports.ApiError = ApiError;
class ValidationError extends ApiError {
    constructor(message, details) {
        super(400, message, details);
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends ApiError {
    constructor(message = 'Resource not found') {
        super(404, message);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
exports.NotFoundError = NotFoundError;
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    const requestId = (0, uuid_1.v4)();
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
    return res.status(500).json({
        error: {
            code: '500',
            message: 'Internal Server Error',
            timestamp: new Date().toISOString(),
            requestId
        }
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map
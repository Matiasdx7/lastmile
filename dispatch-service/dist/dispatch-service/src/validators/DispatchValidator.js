"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispatchValidator = void 0;
const joi_1 = __importDefault(require("joi"));
const types_1 = require("../../../shared/types");
class DispatchValidator {
    static validateCreateDispatch(req, res, next) {
        const schema = joi_1.default.object({
            routeId: joi_1.default.string().uuid().required(),
            vehicleId: joi_1.default.string().uuid().required(),
            driverId: joi_1.default.string().uuid().required()
        });
        const { error } = schema.validate(req.body);
        if (error) {
            res.status(400).json({ error: error.details[0].message });
            return;
        }
        next();
    }
    static validateUpdateStatus(req, res, next) {
        const schema = joi_1.default.object({
            status: joi_1.default.string().valid(...Object.values(types_1.DispatchStatus)).required()
        });
        const { error } = schema.validate(req.body);
        if (error) {
            res.status(400).json({ error: error.details[0].message });
            return;
        }
        next();
    }
}
exports.DispatchValidator = DispatchValidator;
//# sourceMappingURL=DispatchValidator.js.map
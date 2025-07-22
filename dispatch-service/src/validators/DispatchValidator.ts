import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { DispatchStatus } from '../../../shared/types';

export class DispatchValidator {
  static validateCreateDispatch(req: Request, res: Response, next: NextFunction): void {
    const schema = Joi.object({
      routeId: Joi.string().uuid().required(),
      vehicleId: Joi.string().uuid().required(),
      driverId: Joi.string().uuid().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    next();
  }

  static validateUpdateStatus(req: Request, res: Response, next: NextFunction): void {
    const schema = Joi.object({
      status: Joi.string().valid(...Object.values(DispatchStatus)).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    next();
  }
}
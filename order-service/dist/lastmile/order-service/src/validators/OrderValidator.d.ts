import Joi from 'joi';
export declare const createOrderSchema: Joi.ObjectSchema<any>;
export declare const updateOrderSchema: Joi.ObjectSchema<any>;
export declare class OrderValidator {
    static readonly SPECIAL_KEYWORDS: string[];
    static validateCreate(data: any): void;
    static validateUpdate(data: any): void;
    static validateId(id: string): void;
    static needsManualReview(data: any): boolean;
    private static validateBusinessRules;
    private static formatJoiErrors;
}
//# sourceMappingURL=OrderValidator.d.ts.map
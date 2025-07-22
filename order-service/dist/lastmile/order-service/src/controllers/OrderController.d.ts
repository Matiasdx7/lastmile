import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/OrderService';
export declare class OrderController {
    private orderService;
    constructor(orderService: OrderService);
    createOrder(req: Request, res: Response, next: NextFunction): Promise<void>;
    getAllOrders(req: Request, res: Response, next: NextFunction): Promise<void>;
    getOrderById(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateOrder(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteOrder(req: Request, res: Response, next: NextFunction): Promise<void>;
    getOrdersByStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    getOrdersNeedingReview(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=OrderController.d.ts.map
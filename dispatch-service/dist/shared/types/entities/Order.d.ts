import { Address } from '../common/Address';
import { Package } from '../common/Package';
import { TimeWindow } from '../common/TimeWindow';
import { OrderStatus } from '../enums/OrderStatus';
export interface Order {
    id: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: Address;
    packageDetails: Package[];
    specialInstructions?: string;
    timeWindow?: TimeWindow;
    status: OrderStatus;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Order.d.ts.map
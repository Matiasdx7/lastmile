import { OrderStatus } from '../../../shared/types/enums/OrderStatus';
export interface ProcessNode {
    id: string;
    name: string;
    type: 'main' | 'sub' | 'start' | 'end';
    status?: string;
    count?: number;
    metrics?: ProcessMetrics;
    parent?: string;
}
export interface ProcessEdge {
    source: string;
    target: string;
    label?: string;
}
export interface ProcessMetrics {
    averageTime: number;
    count: number;
    errorRate: number;
    bottleneck: boolean;
}
export interface ProcessDiagram {
    nodes: ProcessNode[];
    edges: ProcessEdge[];
}
export interface OrderProcessState {
    orderId: string;
    currentStage: string;
    history: {
        stage: string;
        enteredAt: Date;
        completedAt?: Date;
        duration?: number;
    }[];
}
export declare const processStageMap: {
    'order-reception': OrderStatus[];
    'load-consolidation': OrderStatus[];
    'vehicle-assignment': OrderStatus[];
    'route-planning': OrderStatus[];
    dispatch: OrderStatus[];
    delivery: OrderStatus[];
};
export declare const mainProcessFlow: ProcessDiagram;
export declare const orderStateFlow: ProcessDiagram;
//# sourceMappingURL=BpmModel.d.ts.map
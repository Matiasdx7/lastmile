import { ProcessDiagram } from '../models/BpmModel';
export declare class BpmService {
    private orderRepository;
    private dispatchRepository;
    private loadRepository;
    private routeRepository;
    private vehicleRepository;
    constructor();
    generateProcessDiagram(): Promise<ProcessDiagram>;
    generateOrderProcessDiagram(orderId: string): Promise<ProcessDiagram>;
    getProcessNodeDetails(nodeId: string): Promise<any>;
    private getProcessStageCounts;
    private getProcessMetrics;
    private getOrderProcessState;
    private simulateOrderHistory;
    private getRecentOrdersInStage;
    detectBottlenecks(): Promise<string[]>;
    getSystemMetrics(): Promise<any>;
}
//# sourceMappingURL=BpmService.d.ts.map
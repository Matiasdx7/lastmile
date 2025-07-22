export interface StageMetrics {
    stageName: string;
    stageId: string;
    averageTime: number;
    count: number;
    errorRate: number;
    bottleneck: boolean;
    trend: 'improving' | 'stable' | 'worsening';
}
export interface SystemMetrics {
    totalOrdersProcessed: number;
    totalOrdersInProgress: number;
    averageTotalProcessingTime: number;
    overallErrorRate: number;
    bottlenecks: string[];
    stageMetrics: StageMetrics[];
    timeRangeStart: Date;
    timeRangeEnd: Date;
}
export interface BottleneckInfo {
    stageId: string;
    stageName: string;
    severity: 'low' | 'medium' | 'high';
    averageTime: number;
    count: number;
    recommendation: string;
}
export declare class MetricsService {
    private orderRepository;
    private dispatchRepository;
    private loadRepository;
    private routeRepository;
    private vehicleRepository;
    constructor();
    getStageMetrics(timeRange?: {
        start: Date;
        end: Date;
    }): Promise<StageMetrics[]>;
    getSystemMetrics(timeRange?: {
        start: Date;
        end: Date;
    }): Promise<SystemMetrics>;
    detectBottlenecks(): Promise<BottleneckInfo[]>;
    getPerformanceIndicators(): Promise<any>;
    getHistoricalMetrics(days?: number): Promise<any>;
}
//# sourceMappingURL=MetricsService.d.ts.map
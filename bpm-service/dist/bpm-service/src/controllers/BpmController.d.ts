import { Request, Response } from 'express';
export declare class BpmController {
    private bpmService;
    private metricsService;
    constructor();
    generateProcessDiagram(req: Request, res: Response): Promise<void>;
    generateOrderProcessDiagram(req: Request, res: Response): Promise<void>;
    getProcessNodeDetails(req: Request, res: Response): Promise<void>;
    detectBottlenecks(req: Request, res: Response): Promise<void>;
    getSystemMetrics(req: Request, res: Response): Promise<void>;
    getStageMetrics(req: Request, res: Response): Promise<void>;
    getBottleneckDetails(req: Request, res: Response): Promise<void>;
    getPerformanceIndicators(req: Request, res: Response): Promise<void>;
    getHistoricalMetrics(req: Request, res: Response): Promise<void>;
    generateMermaidDiagram(req: Request, res: Response): Promise<void>;
    private convertToMermaidSyntax;
    private convertToFlowchart;
    private convertToStateDiagram;
}
//# sourceMappingURL=BpmController.d.ts.map
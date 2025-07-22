"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BpmController = void 0;
const BpmService_1 = require("../services/BpmService");
const MetricsService_1 = require("../services/MetricsService");
class BpmController {
    constructor() {
        this.bpmService = new BpmService_1.BpmService();
        this.metricsService = new MetricsService_1.MetricsService();
    }
    async generateProcessDiagram(req, res) {
        try {
            const diagram = await this.bpmService.generateProcessDiagram();
            res.status(200).json(diagram);
        }
        catch (error) {
            console.error('Error generating process diagram:', error);
            res.status(500).json({
                error: {
                    code: 'DIAGRAM_GENERATION_ERROR',
                    message: 'Failed to generate process diagram',
                    details: error instanceof Error ? error.message : undefined,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'] || 'unknown'
                }
            });
        }
    }
    async generateOrderProcessDiagram(req, res) {
        try {
            const { orderId } = req.params;
            if (!orderId) {
                res.status(400).json({
                    error: {
                        code: 'MISSING_ORDER_ID',
                        message: 'Order ID is required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'] || 'unknown'
                    }
                });
                return;
            }
            const diagram = await this.bpmService.generateOrderProcessDiagram(orderId);
            res.status(200).json(diagram);
        }
        catch (error) {
            console.error(`Error generating process diagram for order:`, error);
            res.status(500).json({
                error: {
                    code: 'ORDER_DIAGRAM_GENERATION_ERROR',
                    message: 'Failed to generate process diagram for order',
                    details: error instanceof Error ? error.message : undefined,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'] || 'unknown'
                }
            });
        }
    }
    async getProcessNodeDetails(req, res) {
        try {
            const { nodeId } = req.params;
            if (!nodeId) {
                res.status(400).json({
                    error: {
                        code: 'MISSING_NODE_ID',
                        message: 'Process node ID is required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'] || 'unknown'
                    }
                });
                return;
            }
            const details = await this.bpmService.getProcessNodeDetails(nodeId);
            res.status(200).json(details);
        }
        catch (error) {
            console.error(`Error getting process node details:`, error);
            res.status(500).json({
                error: {
                    code: 'NODE_DETAILS_ERROR',
                    message: 'Failed to get process node details',
                    details: error instanceof Error ? error.message : undefined,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'] || 'unknown'
                }
            });
        }
    }
    async detectBottlenecks(req, res) {
        try {
            const bottlenecks = await this.bpmService.detectBottlenecks();
            res.status(200).json({ bottlenecks });
        }
        catch (error) {
            console.error('Error detecting bottlenecks:', error);
            res.status(500).json({
                error: {
                    code: 'BOTTLENECK_DETECTION_ERROR',
                    message: 'Failed to detect bottlenecks',
                    details: error instanceof Error ? error.message : undefined,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'] || 'unknown'
                }
            });
        }
    }
    async getSystemMetrics(req, res) {
        try {
            const { startDate, endDate } = req.query;
            let timeRange;
            if (startDate && endDate) {
                timeRange = {
                    start: new Date(startDate),
                    end: new Date(endDate)
                };
            }
            const metrics = await this.metricsService.getSystemMetrics(timeRange);
            res.status(200).json(metrics);
        }
        catch (error) {
            console.error('Error getting system metrics:', error);
            res.status(500).json({
                error: {
                    code: 'METRICS_ERROR',
                    message: 'Failed to get system metrics',
                    details: error instanceof Error ? error.message : undefined,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'] || 'unknown'
                }
            });
        }
    }
    async getStageMetrics(req, res) {
        try {
            const { startDate, endDate } = req.query;
            let timeRange;
            if (startDate && endDate) {
                timeRange = {
                    start: new Date(startDate),
                    end: new Date(endDate)
                };
            }
            const metrics = await this.metricsService.getStageMetrics(timeRange);
            res.status(200).json(metrics);
        }
        catch (error) {
            console.error('Error getting stage metrics:', error);
            res.status(500).json({
                error: {
                    code: 'STAGE_METRICS_ERROR',
                    message: 'Failed to get stage metrics',
                    details: error instanceof Error ? error.message : undefined,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'] || 'unknown'
                }
            });
        }
    }
    async getBottleneckDetails(req, res) {
        try {
            const bottlenecks = await this.metricsService.detectBottlenecks();
            res.status(200).json(bottlenecks);
        }
        catch (error) {
            console.error('Error getting bottleneck details:', error);
            res.status(500).json({
                error: {
                    code: 'BOTTLENECK_DETAILS_ERROR',
                    message: 'Failed to get bottleneck details',
                    details: error instanceof Error ? error.message : undefined,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'] || 'unknown'
                }
            });
        }
    }
    async getPerformanceIndicators(req, res) {
        try {
            const indicators = await this.metricsService.getPerformanceIndicators();
            res.status(200).json(indicators);
        }
        catch (error) {
            console.error('Error getting performance indicators:', error);
            res.status(500).json({
                error: {
                    code: 'INDICATORS_ERROR',
                    message: 'Failed to get performance indicators',
                    details: error instanceof Error ? error.message : undefined,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'] || 'unknown'
                }
            });
        }
    }
    async getHistoricalMetrics(req, res) {
        try {
            const days = req.query.days ? parseInt(req.query.days) : 30;
            const metrics = await this.metricsService.getHistoricalMetrics(days);
            res.status(200).json(metrics);
        }
        catch (error) {
            console.error('Error getting historical metrics:', error);
            res.status(500).json({
                error: {
                    code: 'HISTORICAL_METRICS_ERROR',
                    message: 'Failed to get historical metrics',
                    details: error instanceof Error ? error.message : undefined,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'] || 'unknown'
                }
            });
        }
    }
    async generateMermaidDiagram(req, res) {
        try {
            const { type = 'process', orderId } = req.query;
            let diagram;
            if (type === 'order' && orderId) {
                diagram = await this.bpmService.generateOrderProcessDiagram(orderId);
            }
            else {
                diagram = await this.bpmService.generateProcessDiagram();
            }
            const mermaidCode = this.convertToMermaidSyntax(diagram, type);
            res.status(200).json({ mermaidCode });
        }
        catch (error) {
            console.error('Error generating Mermaid diagram:', error);
            res.status(500).json({
                error: {
                    code: 'MERMAID_GENERATION_ERROR',
                    message: 'Failed to generate Mermaid diagram',
                    details: error instanceof Error ? error.message : undefined,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'] || 'unknown'
                }
            });
        }
    }
    convertToMermaidSyntax(diagram, type) {
        if (type === 'state') {
            return this.convertToStateDiagram(diagram);
        }
        else {
            return this.convertToFlowchart(diagram);
        }
    }
    convertToFlowchart(diagram) {
        let mermaid = 'graph LR\n';
        for (const node of diagram.nodes) {
            let style = '';
            if (node.status === 'active') {
                style = ', style fill:#f96, stroke:#333, stroke-width:2px';
            }
            else if (node.status === 'completed') {
                style = ', style fill:#9f6, stroke:#333, stroke-width:1px';
            }
            else if (node.status === 'in-progress') {
                style = ', style fill:#ff9, stroke:#333, stroke-width:1px';
            }
            else if (node.metrics?.bottleneck) {
                style = ', style fill:#f66, stroke:#333, stroke-width:2px';
            }
            let label = node.name;
            if (node.count !== undefined) {
                label += `<br/>(${node.count})`;
            }
            mermaid += `    ${node.id}[${label}${style}]\n`;
        }
        for (const edge of diagram.edges) {
            let label = edge.label ? `|${edge.label}|` : '';
            mermaid += `    ${edge.source} -->${label} ${edge.target}\n`;
        }
        return mermaid;
    }
    convertToStateDiagram(diagram) {
        let mermaid = 'stateDiagram-v2\n';
        for (const node of diagram.nodes) {
            if (node.type === 'start') {
                mermaid += `    [*] --> ${node.id}\n`;
            }
            else if (node.type === 'end') {
                mermaid += `    ${node.id} --> [*]\n`;
            }
            else {
                let style = '';
                if (node.status === 'active') {
                    style = ' : active';
                }
                else if (node.status === 'completed') {
                    style = ' : completed';
                }
                else if (node.status === 'in-progress') {
                    style = ' : in progress';
                }
                mermaid += `    state "${node.name}"${style} as ${node.id}\n`;
            }
        }
        for (const edge of diagram.edges) {
            if (edge.source !== 'start' && edge.target !== 'end') {
                let label = edge.label ? ` : ${edge.label}` : '';
                mermaid += `    ${edge.source} --> ${edge.target}${label}\n`;
            }
        }
        return mermaid;
    }
}
exports.BpmController = BpmController;
//# sourceMappingURL=BpmController.js.map
import { Request, Response } from 'express';
import { BpmService } from '../services/BpmService';
import { MetricsService } from '../services/MetricsService';

export class BpmController {
  private bpmService: BpmService;
  private metricsService: MetricsService;

  constructor() {
    this.bpmService = new BpmService();
    this.metricsService = new MetricsService();
  }

  /**
   * Generate a process diagram with current status information
   */
  async generateProcessDiagram(req: Request, res: Response): Promise<void> {
    try {
      const diagram = await this.bpmService.generateProcessDiagram();
      res.status(200).json(diagram);
    } catch (error) {
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

  /**
   * Generate a process diagram for a specific order
   */
  async generateOrderProcessDiagram(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
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

  /**
   * Get detailed information about a specific process node
   */
  async getProcessNodeDetails(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
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

  /**
   * Detect bottlenecks in the process flow
   */
  async detectBottlenecks(req: Request, res: Response): Promise<void> {
    try {
      const bottlenecks = await this.bpmService.detectBottlenecks();
      res.status(200).json({ bottlenecks });
    } catch (error) {
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

  /**
   * Get performance metrics for the entire process
   */
  async getSystemMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      
      let timeRange;
      if (startDate && endDate) {
        timeRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }
      
      const metrics = await this.metricsService.getSystemMetrics(timeRange);
      res.status(200).json(metrics);
    } catch (error) {
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
  
  /**
   * Get performance metrics for individual stages
   */
  async getStageMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      
      let timeRange;
      if (startDate && endDate) {
        timeRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }
      
      const metrics = await this.metricsService.getStageMetrics(timeRange);
      res.status(200).json(metrics);
    } catch (error) {
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
  
  /**
   * Get detailed bottleneck information
   */
  async getBottleneckDetails(req: Request, res: Response): Promise<void> {
    try {
      const bottlenecks = await this.metricsService.detectBottlenecks();
      res.status(200).json(bottlenecks);
    } catch (error) {
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
  
  /**
   * Get performance indicators for each process stage
   */
  async getPerformanceIndicators(req: Request, res: Response): Promise<void> {
    try {
      const indicators = await this.metricsService.getPerformanceIndicators();
      res.status(200).json(indicators);
    } catch (error) {
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
  
  /**
   * Get historical metrics for trend analysis
   */
  async getHistoricalMetrics(req: Request, res: Response): Promise<void> {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const metrics = await this.metricsService.getHistoricalMetrics(days);
      res.status(200).json(metrics);
    } catch (error) {
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

  /**
   * Generate a Mermaid diagram string for the process flow
   */
  async generateMermaidDiagram(req: Request, res: Response): Promise<void> {
    try {
      const { type = 'process', orderId } = req.query;
      
      let diagram;
      if (type === 'order' && orderId) {
        diagram = await this.bpmService.generateOrderProcessDiagram(orderId as string);
      } else {
        diagram = await this.bpmService.generateProcessDiagram();
      }
      
      // Convert the diagram to Mermaid syntax
      const mermaidCode = this.convertToMermaidSyntax(diagram, type as string);
      
      res.status(200).json({ mermaidCode });
    } catch (error) {
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

  /**
   * Convert a process diagram to Mermaid syntax
   */
  private convertToMermaidSyntax(diagram: any, type: string): string {
    if (type === 'state') {
      return this.convertToStateDiagram(diagram);
    } else {
      return this.convertToFlowchart(diagram);
    }
  }

  /**
   * Convert a process diagram to Mermaid flowchart syntax
   */
  private convertToFlowchart(diagram: any): string {
    let mermaid = 'graph LR\n';
    
    // Add nodes
    for (const node of diagram.nodes) {
      let style = '';
      
      if (node.status === 'active') {
        style = ', style fill:#f96, stroke:#333, stroke-width:2px';
      } else if (node.status === 'completed') {
        style = ', style fill:#9f6, stroke:#333, stroke-width:1px';
      } else if (node.status === 'in-progress') {
        style = ', style fill:#ff9, stroke:#333, stroke-width:1px';
      } else if (node.metrics?.bottleneck) {
        style = ', style fill:#f66, stroke:#333, stroke-width:2px';
      }
      
      let label = node.name;
      if (node.count !== undefined) {
        label += `<br/>(${node.count})`;
      }
      
      mermaid += `    ${node.id}[${label}${style}]\n`;
    }
    
    // Add edges
    for (const edge of diagram.edges) {
      let label = edge.label ? `|${edge.label}|` : '';
      mermaid += `    ${edge.source} -->${label} ${edge.target}\n`;
    }
    
    return mermaid;
  }

  /**
   * Convert a process diagram to Mermaid state diagram syntax
   */
  private convertToStateDiagram(diagram: any): string {
    let mermaid = 'stateDiagram-v2\n';
    
    // Add states
    for (const node of diagram.nodes) {
      if (node.type === 'start') {
        mermaid += `    [*] --> ${node.id}\n`;
      } else if (node.type === 'end') {
        mermaid += `    ${node.id} --> [*]\n`;
      } else {
        let style = '';
        if (node.status === 'active') {
          style = ' : active';
        } else if (node.status === 'completed') {
          style = ' : completed';
        } else if (node.status === 'in-progress') {
          style = ' : in progress';
        }
        
        mermaid += `    state "${node.name}"${style} as ${node.id}\n`;
      }
    }
    
    // Add transitions
    for (const edge of diagram.edges) {
      if (edge.source !== 'start' && edge.target !== 'end') {
        let label = edge.label ? ` : ${edge.label}` : '';
        mermaid += `    ${edge.source} --> ${edge.target}${label}\n`;
      }
    }
    
    return mermaid;
  }
}
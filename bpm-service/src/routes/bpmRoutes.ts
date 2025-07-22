import { Router } from 'express';
import { BpmController } from '../controllers/BpmController';

const router = Router();
const bpmController = new BpmController();

// Generate process diagram with current status information
router.get('/diagram', (req, res) => bpmController.generateProcessDiagram(req, res));

// Generate process diagram for a specific order
router.get('/orders/:orderId/diagram', (req, res) => bpmController.generateOrderProcessDiagram(req, res));

// Get detailed information about a specific process node
router.get('/nodes/:nodeId', (req, res) => bpmController.getProcessNodeDetails(req, res));

// Detect bottlenecks in the process flow
router.get('/bottlenecks', (req, res) => bpmController.detectBottlenecks(req, res));

// Get detailed bottleneck information with recommendations
router.get('/bottlenecks/details', (req, res) => bpmController.getBottleneckDetails(req, res));

// Get performance metrics for the entire process
router.get('/metrics/system', (req, res) => bpmController.getSystemMetrics(req, res));

// Get performance metrics for individual stages
router.get('/metrics/stages', (req, res) => bpmController.getStageMetrics(req, res));

// Get performance indicators for each process stage
router.get('/metrics/indicators', (req, res) => bpmController.getPerformanceIndicators(req, res));

// Get historical metrics for trend analysis
router.get('/metrics/historical', (req, res) => bpmController.getHistoricalMetrics(req, res));

// Generate a Mermaid diagram string for the process flow
router.get('/mermaid', (req, res) => bpmController.generateMermaidDiagram(req, res));

export default router;
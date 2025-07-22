"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BpmController_1 = require("../controllers/BpmController");
const router = (0, express_1.Router)();
const bpmController = new BpmController_1.BpmController();
router.get('/diagram', (req, res) => bpmController.generateProcessDiagram(req, res));
router.get('/orders/:orderId/diagram', (req, res) => bpmController.generateOrderProcessDiagram(req, res));
router.get('/nodes/:nodeId', (req, res) => bpmController.getProcessNodeDetails(req, res));
router.get('/bottlenecks', (req, res) => bpmController.detectBottlenecks(req, res));
router.get('/bottlenecks/details', (req, res) => bpmController.getBottleneckDetails(req, res));
router.get('/metrics/system', (req, res) => bpmController.getSystemMetrics(req, res));
router.get('/metrics/stages', (req, res) => bpmController.getStageMetrics(req, res));
router.get('/metrics/indicators', (req, res) => bpmController.getPerformanceIndicators(req, res));
router.get('/metrics/historical', (req, res) => bpmController.getHistoricalMetrics(req, res));
router.get('/mermaid', (req, res) => bpmController.generateMermaidDiagram(req, res));
exports.default = router;
//# sourceMappingURL=bpmRoutes.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDispatchRoutes = void 0;
const express_1 = require("express");
const createDispatchRoutes = (dispatchController) => {
    const router = (0, express_1.Router)();
    router.post('/', dispatchController.createDispatch.bind(dispatchController));
    router.get('/', dispatchController.getAllDispatches.bind(dispatchController));
    router.get('/active', dispatchController.getActiveDispatches.bind(dispatchController));
    router.get('/:id', dispatchController.getDispatch.bind(dispatchController));
    router.post('/:id/confirm', dispatchController.confirmDispatch.bind(dispatchController));
    router.get('/:id/route-summary', dispatchController.getRouteSummary.bind(dispatchController));
    router.get('/:id/detailed-summary', dispatchController.getDetailedRouteSummary.bind(dispatchController));
    router.post('/:id/send-to-driver', dispatchController.sendRouteToDriver.bind(dispatchController));
    router.post('/:id/confirm-and-send', dispatchController.confirmDispatchAndSendRoute.bind(dispatchController));
    router.put('/:id/status', dispatchController.updateDispatchStatus.bind(dispatchController));
    return router;
};
exports.createDispatchRoutes = createDispatchRoutes;
//# sourceMappingURL=dispatchRoutes.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVehicleAssignmentRouter = void 0;
const express_1 = require("express");
const createVehicleAssignmentRouter = (vehicleAssignmentController) => {
    const router = (0, express_1.Router)();
    router.post('/loads/:loadId/assign', vehicleAssignmentController.assignVehicleToLoad);
    router.post('/loads/:loadId/unassign', vehicleAssignmentController.unassignVehicleFromLoad);
    router.get('/vehicles/:vehicleId/loads', vehicleAssignmentController.getLoadsForVehicle);
    router.post('/batch-assign', vehicleAssignmentController.batchAssignVehicles);
    router.get('/vehicles/:vehicleId/capacity-check/:loadId', vehicleAssignmentController.checkVehicleCapacityForLoad);
    return router;
};
exports.createVehicleAssignmentRouter = createVehicleAssignmentRouter;
//# sourceMappingURL=vehicleAssignmentRoutes.js.map
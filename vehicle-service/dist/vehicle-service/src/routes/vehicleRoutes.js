"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVehicleRouter = void 0;
const express_1 = require("express");
const createVehicleRouter = (vehicleController) => {
    const router = (0, express_1.Router)();
    router.get('/', vehicleController.getAllVehicles);
    router.get('/:id', vehicleController.getVehicleById);
    router.post('/', vehicleController.createVehicle);
    router.put('/:id', vehicleController.updateVehicle);
    router.delete('/:id', vehicleController.deleteVehicle);
    router.put('/:id/status', vehicleController.updateVehicleStatus);
    router.put('/:id/location', vehicleController.updateVehicleLocation);
    router.get('/:id/capacity', vehicleController.getVehicleCapacity);
    router.get('/available/area', vehicleController.findAvailableVehiclesInArea);
    return router;
};
exports.createVehicleRouter = createVehicleRouter;
//# sourceMappingURL=vehicleRoutes.js.map
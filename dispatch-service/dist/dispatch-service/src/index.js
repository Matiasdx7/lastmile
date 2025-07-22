"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = require("pg");
const dispatchRoutes_1 = require("./routes/dispatchRoutes");
const DispatchController_1 = require("./controllers/DispatchController");
const DispatchService_1 = require("./services/DispatchService");
const DispatchRepository_1 = require("../../shared/database/repositories/DispatchRepository");
const RouteRepository_1 = require("../../shared/database/repositories/RouteRepository");
const OrderRepository_1 = require("../../shared/database/repositories/OrderRepository");
const VehicleRepository_1 = require("../../shared/database/repositories/VehicleRepository");
const DispatchValidator_1 = require("./validators/DispatchValidator");
dotenv_1.default.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
const dispatchRepository = new DispatchRepository_1.DispatchRepository(pool);
const routeRepository = new RouteRepository_1.RouteRepository(pool);
const orderRepository = new OrderRepository_1.OrderRepository(pool);
const vehicleRepository = new VehicleRepository_1.VehicleRepository(pool);
const dispatchService = new DispatchService_1.DispatchService(dispatchRepository, routeRepository, orderRepository, vehicleRepository);
const dispatchController = new DispatchController_1.DispatchController(dispatchService);
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3003;
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use('/api/dispatch', (0, dispatchRoutes_1.createDispatchRoutes)(dispatchController));
app.post('/api/dispatch', DispatchValidator_1.DispatchValidator.validateCreateDispatch);
app.put('/api/dispatch/:id/status', DispatchValidator_1.DispatchValidator.validateUpdateStatus);
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
app.listen(PORT, () => {
    console.log(`Dispatch service running on port ${PORT}`);
});
process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=index.js.map
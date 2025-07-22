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
const vehicleRoutes_1 = require("./routes/vehicleRoutes");
const vehicleAssignmentRoutes_1 = require("./routes/vehicleAssignmentRoutes");
const VehicleController_1 = require("./controllers/VehicleController");
const VehicleAssignmentController_1 = require("./controllers/VehicleAssignmentController");
const VehicleService_1 = require("./services/VehicleService");
const VehicleAssignmentService_1 = require("./services/VehicleAssignmentService");
const VehicleValidator_1 = require("./validators/VehicleValidator");
const VehicleRepository_1 = require("../../shared/database/repositories/VehicleRepository");
const LoadRepository_1 = require("../../shared/database/repositories/LoadRepository");
dotenv_1.default.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
const vehicleRepository = new VehicleRepository_1.VehicleRepository(pool);
const loadRepository = new LoadRepository_1.LoadRepository(pool);
const vehicleValidator = new VehicleValidator_1.VehicleValidator();
const vehicleService = new VehicleService_1.VehicleService(vehicleRepository, vehicleValidator);
const vehicleAssignmentService = new VehicleAssignmentService_1.VehicleAssignmentService(vehicleRepository, loadRepository);
const vehicleController = new VehicleController_1.VehicleController(vehicleService);
const vehicleAssignmentController = new VehicleAssignmentController_1.VehicleAssignmentController(vehicleAssignmentService);
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3002;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/health', (req, res) => {
    res.status(200).json({
        service: 'vehicle-service',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});
app.get('/', (req, res) => {
    res.json({
        message: 'Vehicle Service API',
        version: '1.0.0'
    });
});
app.use('/api/vehicles', (0, vehicleRoutes_1.createVehicleRouter)(vehicleController));
app.use('/api/assignments', (0, vehicleAssignmentRoutes_1.createVehicleAssignmentRouter)(vehicleAssignmentController));
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
            timestamp: new Date().toISOString()
        }
    });
});
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Vehicle Service running on port ${PORT}`);
    });
}
exports.default = app;
//# sourceMappingURL=index.js.map
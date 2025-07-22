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
const connection_1 = require("../../shared/database/connection");
const orderRoutes_1 = require("./routes/orderRoutes");
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const dbConnection = connection_1.DatabaseConnection.getInstance();
let dbPool;
let redisClient = null;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/health', (req, res) => {
    res.status(200).json({
        service: 'order-service',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});
app.get('/', (req, res) => {
    res.json({
        message: 'Order Service API',
        version: '1.0.0'
    });
});
const initializeApp = async () => {
    try {
        dbPool = await dbConnection.initializePostgreSQL((0, connection_1.getDatabaseConfigFromEnv)());
        if (process.env.REDIS_ENABLED === 'true') {
            try {
                redisClient = await dbConnection.initializeRedis((0, connection_1.getRedisConfigFromEnv)());
                console.log('Redis connection established successfully');
            }
            catch (redisError) {
                console.warn('Failed to connect to Redis, continuing without caching:', redisError);
                redisClient = null;
            }
        }
        app.use('/api/orders', (0, orderRoutes_1.createOrderRouter)(dbPool, redisClient));
        app.use(errorHandler_1.errorHandler);
        console.log('Order Service initialized successfully');
    }
    catch (error) {
        console.error('Failed to initialize Order Service:', error);
        process.exit(1);
    }
};
if (process.env.NODE_ENV !== 'test') {
    initializeApp().then(() => {
        app.listen(PORT, () => {
            console.log(`Order Service running on port ${PORT}`);
        });
    });
}
process.on('SIGINT', async () => {
    console.log('Shutting down Order Service...');
    try {
        await dbConnection.closeConnections();
        process.exit(0);
    }
    catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});
exports.default = app;
//# sourceMappingURL=index.js.map
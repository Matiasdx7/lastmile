"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const routeRoutes_1 = __importDefault(require("./routes/routeRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
const dbPool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'lastmile',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
});
app.locals.dbPool = dbPool;
app.use('/api/routes', (0, routeRoutes_1.default)(dbPool));
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'route-service' });
});
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Route service running on port ${PORT}`);
});
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    dbPool.end().then(() => {
        console.log('Database pool closed');
        process.exit(0);
    });
});
exports.default = app;
//# sourceMappingURL=index.js.map
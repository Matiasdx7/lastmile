"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class RouteRepository extends BaseRepository_1.BaseRepository {
    constructor(pool) {
        super(pool, 'routes');
    }
    mapRowToEntity(row) {
        return {
            id: row.id,
            loadId: row.load_id,
            vehicleId: row.vehicle_id,
            stops: row.stops,
            totalDistance: parseFloat(row.total_distance),
            estimatedDuration: parseInt(row.estimated_duration),
            status: row.status,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
    }
    mapEntityToRow(entity) {
        return {
            load_id: entity.loadId,
            vehicle_id: entity.vehicleId,
            stops: JSON.stringify(entity.stops),
            total_distance: entity.totalDistance,
            estimated_duration: entity.estimatedDuration,
            status: entity.status
        };
    }
    async findByStatus(status) {
        const rows = await this.executeQuery(`SELECT * FROM ${this.tableName} WHERE status = $1 ORDER BY created_at DESC`, [status]);
        return rows.map(row => this.mapRowToEntity(row));
    }
    async findByLoadId(loadId) {
        const rows = await this.executeQuery(`SELECT * FROM ${this.tableName} WHERE load_id = $1`, [loadId]);
        return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
    }
    async findByVehicleId(vehicleId) {
        const rows = await this.executeQuery(`SELECT * FROM ${this.tableName} WHERE vehicle_id = $1 ORDER BY created_at DESC`, [vehicleId]);
        return rows.map(row => this.mapRowToEntity(row));
    }
    async updateStatus(id, status) {
        return this.update(id, { status });
    }
    async updateStops(id, stops) {
        return this.update(id, { stops });
    }
    async updateRouteMetrics(id, totalDistance, estimatedDuration) {
        return this.update(id, {
            totalDistance,
            estimatedDuration
        });
    }
    async findActiveRoutes() {
        const rows = await this.executeQuery(`SELECT * FROM ${this.tableName} WHERE status IN ('dispatched', 'in_progress') ORDER BY created_at ASC`);
        return rows.map(row => this.mapRowToEntity(row));
    }
    async findRoutesForOptimization() {
        const rows = await this.executeQuery(`SELECT * FROM ${this.tableName} WHERE status = 'planned' ORDER BY created_at ASC`);
        return rows.map(row => this.mapRowToEntity(row));
    }
}
exports.RouteRepository = RouteRepository;
//# sourceMappingURL=RouteRepository.js.map
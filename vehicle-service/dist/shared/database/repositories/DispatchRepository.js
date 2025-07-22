"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispatchRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const types_1 = require("../../types");
class DispatchRepository extends BaseRepository_1.BaseRepository {
    constructor(pool) {
        super(pool, 'dispatches');
    }
    mapRowToEntity(row) {
        return {
            id: row.id,
            routeId: row.route_id,
            vehicleId: row.vehicle_id,
            driverId: row.driver_id,
            status: row.status,
            startTime: row.start_time ? new Date(row.start_time) : undefined,
            completedTime: row.completed_time ? new Date(row.completed_time) : undefined,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
    }
    mapEntityToRow(entity) {
        return {
            route_id: entity.routeId,
            vehicle_id: entity.vehicleId,
            driver_id: entity.driverId,
            status: entity.status,
            start_time: entity.startTime,
            completed_time: entity.completedTime
        };
    }
    async findByStatus(status) {
        const rows = await this.executeQuery(`SELECT * FROM ${this.tableName} WHERE status = $1 ORDER BY created_at DESC`, [status]);
        return rows.map(row => this.mapRowToEntity(row));
    }
    async findByRouteId(routeId) {
        const rows = await this.executeQuery(`SELECT * FROM ${this.tableName} WHERE route_id = $1`, [routeId]);
        return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
    }
    async findByVehicleId(vehicleId) {
        const rows = await this.executeQuery(`SELECT * FROM ${this.tableName} WHERE vehicle_id = $1 ORDER BY created_at DESC`, [vehicleId]);
        return rows.map(row => this.mapRowToEntity(row));
    }
    async findByDriverId(driverId) {
        const rows = await this.executeQuery(`SELECT * FROM ${this.tableName} WHERE driver_id = $1 ORDER BY created_at DESC`, [driverId]);
        return rows.map(row => this.mapRowToEntity(row));
    }
    async updateStatus(id, status) {
        return this.update(id, { status });
    }
    async startDispatch(id) {
        return this.update(id, {
            status: types_1.DispatchStatus.ACTIVE,
            startTime: new Date()
        });
    }
    async completeDispatch(id) {
        return this.update(id, {
            status: types_1.DispatchStatus.COMPLETED,
            completedTime: new Date()
        });
    }
    async findActiveDispatches() {
        const rows = await this.executeQuery(`SELECT * FROM ${this.tableName} WHERE status = 'active' ORDER BY start_time ASC`);
        return rows.map(row => this.mapRowToEntity(row));
    }
    async findDispatchesInTimeRange(startDate, endDate) {
        const rows = await this.executeQuery(`SELECT * FROM ${this.tableName} 
       WHERE created_at >= $1 AND created_at <= $2 
       ORDER BY created_at DESC`, [startDate, endDate]);
        return rows.map(row => this.mapRowToEntity(row));
    }
}
exports.DispatchRepository = DispatchRepository;
//# sourceMappingURL=DispatchRepository.js.map
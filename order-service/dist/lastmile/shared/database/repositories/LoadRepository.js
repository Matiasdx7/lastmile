"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class LoadRepository extends BaseRepository_1.BaseRepository {
    constructor(pool) {
        super(pool, 'loads');
    }
    mapRowToEntity(row) {
        return {
            id: row.id,
            orders: row.order_ids,
            vehicleId: row.vehicle_id,
            totalWeight: parseFloat(row.total_weight),
            totalVolume: parseFloat(row.total_volume),
            status: row.status,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
    }
    mapEntityToRow(entity) {
        return {
            order_ids: entity.orders,
            vehicle_id: entity.vehicleId,
            total_weight: entity.totalWeight,
            total_volume: entity.totalVolume,
            status: entity.status
        };
    }
    async findByStatus(status) {
        const rows = await this.executeQuery(`SELECT * FROM ${this.tableName} WHERE status = $1 ORDER BY created_at DESC`, [status]);
        return rows.map(row => this.mapRowToEntity(row));
    }
    async findByVehicleId(vehicleId) {
        const rows = await this.executeQuery(`SELECT * FROM ${this.tableName} WHERE vehicle_id = $1 ORDER BY created_at DESC`, [vehicleId]);
        return rows.map(row => this.mapRowToEntity(row));
    }
    async findByOrderId(orderId) {
        const rows = await this.executeQuery(`SELECT * FROM ${this.tableName} WHERE $1 = ANY(order_ids)`, [orderId]);
        return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
    }
    async updateStatus(id, status) {
        return this.update(id, { status });
    }
    async assignVehicle(id, vehicleId) {
        return this.update(id, { vehicleId });
    }
    async addOrderToLoad(loadId, orderId) {
        const query = `
      UPDATE ${this.tableName}
      SET order_ids = array_append(order_ids, $2)
      WHERE id = $1 AND NOT ($2 = ANY(order_ids))
      RETURNING *
    `;
        const rows = await this.executeQuery(query, [loadId, orderId]);
        return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
    }
    async removeOrderFromLoad(loadId, orderId) {
        const query = `
      UPDATE ${this.tableName}
      SET order_ids = array_remove(order_ids, $2)
      WHERE id = $1
      RETURNING *
    `;
        const rows = await this.executeQuery(query, [loadId, orderId]);
        return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
    }
    async findUnassignedLoads() {
        const rows = await this.executeQuery(`SELECT * FROM ${this.tableName} WHERE vehicle_id IS NULL AND status = 'consolidated' ORDER BY created_at ASC`);
        return rows.map(row => this.mapRowToEntity(row));
    }
}
exports.LoadRepository = LoadRepository;
//# sourceMappingURL=LoadRepository.js.map
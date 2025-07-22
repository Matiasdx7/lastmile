"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class OrderRepository extends BaseRepository_1.BaseRepository {
    constructor(pool) {
        super(pool, 'orders');
    }
    mapRowToEntity(row) {
        return {
            id: row.id,
            customerId: row.customer_id,
            customerName: row.customer_name,
            customerPhone: row.customer_phone,
            deliveryAddress: row.delivery_address,
            packageDetails: row.package_details,
            specialInstructions: row.special_instructions,
            timeWindow: row.time_window,
            status: row.status,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
    }
    mapEntityToRow(entity) {
        return {
            customer_id: entity.customerId,
            customer_name: entity.customerName,
            customer_phone: entity.customerPhone,
            delivery_address: JSON.stringify(entity.deliveryAddress),
            package_details: JSON.stringify(entity.packageDetails),
            special_instructions: entity.specialInstructions,
            time_window: entity.timeWindow ? JSON.stringify(entity.timeWindow) : null,
            status: entity.status
        };
    }
    async findByStatus(status) {
        const rows = await this.executeQuery(`SELECT * FROM ${this.tableName} WHERE status = $1 ORDER BY created_at DESC`, [status]);
        return rows.map(row => this.mapRowToEntity(row));
    }
    async findByCustomerId(customerId) {
        const rows = await this.executeQuery(`SELECT * FROM ${this.tableName} WHERE customer_id = $1 ORDER BY created_at DESC`, [customerId]);
        return rows.map(row => this.mapRowToEntity(row));
    }
    async updateStatus(id, status) {
        return this.update(id, { status });
    }
    async findPendingOrdersInArea(latitude, longitude, radiusKm = 10) {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE status = 'pending'
      AND (
        6371 * acos(
          cos(radians($1)) * cos(radians((delivery_address->>'coordinates'->>'latitude')::float))
          * cos(radians((delivery_address->>'coordinates'->>'longitude')::float) - radians($2))
          + sin(radians($1)) * sin(radians((delivery_address->>'coordinates'->>'latitude')::float))
        )
      ) <= $3
      ORDER BY created_at ASC
    `;
        const rows = await this.executeQuery(query, [latitude, longitude, radiusKm]);
        return rows.map(row => this.mapRowToEntity(row));
    }
}
exports.OrderRepository = OrderRepository;
//# sourceMappingURL=OrderRepository.js.map
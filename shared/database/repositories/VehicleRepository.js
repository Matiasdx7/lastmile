"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class VehicleRepository extends BaseRepository_1.BaseRepository {
    constructor(pool) {
        super(pool, 'vehicles');
    }
    mapRowToEntity(row) {
        return {
            id: row.id,
            licensePlate: row.license_plate,
            type: row.type,
            capacity: row.capacity,
            currentLocation: row.current_location,
            status: row.status,
            driverId: row.driver_id,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
    }
    mapEntityToRow(entity) {
        return {
            license_plate: entity.licensePlate,
            type: entity.type,
            capacity: JSON.stringify(entity.capacity),
            current_location: entity.currentLocation ? JSON.stringify(entity.currentLocation) : null,
            status: entity.status,
            driver_id: entity.driverId
        };
    }
    async findByStatus(status) {
        const rows = await this.executeQuery(`SELECT * FROM ${this.tableName} WHERE status = $1 ORDER BY created_at DESC`, [status]);
        return rows.map(row => this.mapRowToEntity(row));
    }
    async findByDriverId(driverId) {
        const rows = await this.executeQuery(`SELECT * FROM ${this.tableName} WHERE driver_id = $1`, [driverId]);
        return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
    }
    async findByLicensePlate(licensePlate) {
        const rows = await this.executeQuery(`SELECT * FROM ${this.tableName} WHERE license_plate = $1`, [licensePlate]);
        return rows.length > 0 ? this.mapRowToEntity(rows[0]) : null;
    }
    async updateStatus(id, status) {
        return this.update(id, { status });
    }
    async updateLocation(id, latitude, longitude) {
        return this.update(id, {
            currentLocation: { latitude, longitude }
        });
    }
    async findAvailableVehiclesInArea(latitude, longitude, radiusKm = 50) {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE status = 'available'
      AND current_location IS NOT NULL
      AND (
        6371 * acos(
          cos(radians($1)) * cos(radians((current_location->>'latitude')::float))
          * cos(radians((current_location->>'longitude')::float) - radians($2))
          + sin(radians($1)) * sin(radians((current_location->>'latitude')::float))
        )
      ) <= $3
      ORDER BY (
        6371 * acos(
          cos(radians($1)) * cos(radians((current_location->>'latitude')::float))
          * cos(radians((current_location->>'longitude')::float) - radians($2))
          + sin(radians($1)) * sin(radians((current_location->>'latitude')::float))
        )
      ) ASC
    `;
        const rows = await this.executeQuery(query, [latitude, longitude, radiusKm]);
        return rows.map(row => this.mapRowToEntity(row));
    }
    async findByType(type) {
        const rows = await this.executeQuery(`SELECT * FROM ${this.tableName} WHERE type = $1 ORDER BY created_at DESC`, [type]);
        return rows.map(row => this.mapRowToEntity(row));
    }
}
exports.VehicleRepository = VehicleRepository;
//# sourceMappingURL=VehicleRepository.js.map
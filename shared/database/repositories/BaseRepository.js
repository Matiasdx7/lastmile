"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
class BaseRepository {
    constructor(pool, tableName) {
        this.pool = pool;
        this.tableName = tableName;
    }
    async findById(id) {
        const client = await this.pool.connect();
        try {
            const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
            const result = await client.query(query, [id]);
            if (result.rows.length === 0) {
                return null;
            }
            return this.mapRowToEntity(result.rows[0]);
        }
        finally {
            client.release();
        }
    }
    async findAll(limit = 100, offset = 0) {
        const client = await this.pool.connect();
        try {
            const query = `SELECT * FROM ${this.tableName} ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
            const result = await client.query(query, [limit, offset]);
            return result.rows.map(row => this.mapRowToEntity(row));
        }
        finally {
            client.release();
        }
    }
    async create(entity) {
        const client = await this.pool.connect();
        try {
            const row = this.mapEntityToRow(entity);
            const columns = Object.keys(row);
            const values = Object.values(row);
            const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
            const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;
            const result = await client.query(query, values);
            return this.mapRowToEntity(result.rows[0]);
        }
        finally {
            client.release();
        }
    }
    async update(id, updates) {
        const client = await this.pool.connect();
        try {
            const row = this.mapEntityToRow(updates);
            const columns = Object.keys(row);
            const values = Object.values(row);
            if (columns.length === 0) {
                return this.findById(id);
            }
            const setClause = columns.map((col, index) => `${col} = $${index + 2}`).join(', ');
            const query = `
        UPDATE ${this.tableName}
        SET ${setClause}
        WHERE id = $1
        RETURNING *
      `;
            const result = await client.query(query, [id, ...values]);
            if (result.rows.length === 0) {
                return null;
            }
            return this.mapRowToEntity(result.rows[0]);
        }
        finally {
            client.release();
        }
    }
    async delete(id) {
        const client = await this.pool.connect();
        try {
            const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
            const result = await client.query(query, [id]);
            return result.rowCount !== null && result.rowCount > 0;
        }
        finally {
            client.release();
        }
    }
    async executeQuery(query, params = []) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(query, params);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=BaseRepository.js.map
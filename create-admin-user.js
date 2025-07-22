const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'lastmiledelivery',
  user: 'postgres',
  password: 'postgres'
});

async function createAdminUser() {
  try {
    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Creating users table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          role VARCHAR(50) NOT NULL,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL
        );
      `);
      
      console.log('Creating indexes...');
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      `);
    }
    
    // Check if admin user exists
    const userCheck = await pool.query(`
      SELECT * FROM users WHERE username = 'admin';
    `);
    
    if (userCheck.rows.length > 0) {
      console.log('Admin user already exists');
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin123!', salt);
    
    // Create admin user
    await pool.query(`
      INSERT INTO users (
        id, username, email, password, first_name, last_name, role, active, created_at, updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        'admin',
        'admin@lastmile.com',
        $1,
        'System',
        'Administrator',
        'admin',
        TRUE,
        NOW(),
        NOW()
      )
    `, [hashedPassword]);
    
    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser();
#!/usr/bin/env node

/**
 * Script to apply database optimizations
 * This script reads the optimizations.sql file and applies it to the database
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Database connection configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'lastmiledelivery',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
};

// Create a new pool instance
const pool = new Pool(dbConfig);

async function applyOptimizations() {
  try {
    console.log('Applying database optimizations...');
    
    // Read the optimizations SQL file
    const optimizationsPath = path.join(__dirname, 'optimizations.sql');
    const optimizationsSQL = fs.readFileSync(optimizationsPath, 'utf8');
    
    // Connect to the database
    const client = await pool.connect();
    
    try {
      // Execute the optimizations
      await client.query(optimizationsSQL);
      console.log('Database optimizations applied successfully');
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Error applying database optimizations:', error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the function
applyOptimizations();
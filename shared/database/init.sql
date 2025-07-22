-- Database initialization script for Last Mile Delivery System

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS lastmiledelivery;

-- Connect to the database
\c lastmiledelivery;

-- Import schema
\i /docker-entrypoint-initdb.d/1-schema.sql

-- Import sample data
\i /docker-entrypoint-initdb.d/2-sample-data.sql

-- Apply optimizations
\i /docker-entrypoint-initdb.d/3-optimizations.sql

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE lastmiledelivery TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
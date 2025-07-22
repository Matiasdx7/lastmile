-- Last Mile Delivery System Database Schema
-- PostgreSQL Database Schema for all microservices

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE order_status AS ENUM (
    'pending',
    'consolidated', 
    'assigned',
    'routed',
    'dispatched',
    'in_transit',
    'delivered',
    'failed',
    'cancelled'
);

CREATE TYPE vehicle_status AS ENUM (
    'available',
    'assigned',
    'in_transit',
    'maintenance',
    'offline'
);

CREATE TYPE vehicle_type AS ENUM (
    'van',
    'truck',
    'motorcycle',
    'car'
);

CREATE TYPE load_status AS ENUM (
    'pending',
    'consolidated',
    'assigned',
    'dispatched',
    'completed'
);

CREATE TYPE route_status AS ENUM (
    'planned',
    'optimized',
    'dispatched',
    'in_progress',
    'completed'
);

CREATE TYPE dispatch_status AS ENUM (
    'pending',
    'active',
    'completed',
    'cancelled'
);

CREATE TYPE delivery_status AS ENUM (
    'pending',
    'delivered',
    'failed',
    'rescheduled'
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    
    -- Delivery address (embedded JSON for flexibility)
    delivery_address JSONB NOT NULL,
    
    -- Package details (array of packages as JSON)
    package_details JSONB NOT NULL,
    
    special_instructions TEXT,
    
    -- Time window (JSON with start_time and end_time)
    time_window JSONB,
    
    status order_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles table
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    type vehicle_type NOT NULL,
    
    -- Vehicle capacity (JSON with maxWeight, maxVolume, maxPackages)
    capacity JSONB NOT NULL,
    
    -- Current location (JSON with latitude, longitude)
    current_location JSONB,
    
    status vehicle_status NOT NULL DEFAULT 'available',
    driver_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Loads table (consolidated orders)
CREATE TABLE loads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Array of order IDs
    order_ids UUID[] NOT NULL,
    
    vehicle_id UUID REFERENCES vehicles(id),
    total_weight DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_volume DECIMAL(10,2) NOT NULL DEFAULT 0,
    status load_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Routes table
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_id UUID NOT NULL REFERENCES loads(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    
    -- Route stops (JSON array with stop details)
    stops JSONB NOT NULL,
    
    total_distance DECIMAL(10,2) NOT NULL DEFAULT 0,
    estimated_duration INTEGER NOT NULL DEFAULT 0, -- in seconds
    status route_status NOT NULL DEFAULT 'planned',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dispatches table
CREATE TABLE dispatches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES routes(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    driver_id VARCHAR(255) NOT NULL,
    status dispatch_status NOT NULL DEFAULT 'pending',
    start_time TIMESTAMP WITH TIME ZONE,
    completed_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for optimized queries
-- Orders indexes
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_delivery_address_coords ON orders USING GIN ((delivery_address->'coordinates'));

-- Vehicles indexes
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_type ON vehicles(type);
CREATE INDEX idx_vehicles_driver_id ON vehicles(driver_id);
CREATE INDEX idx_vehicles_location ON vehicles USING GIN (current_location);

-- Loads indexes
CREATE INDEX idx_loads_status ON loads(status);
CREATE INDEX idx_loads_vehicle_id ON loads(vehicle_id);
CREATE INDEX idx_loads_order_ids ON loads USING GIN (order_ids);

-- Routes indexes
CREATE INDEX idx_routes_status ON routes(status);
CREATE INDEX idx_routes_load_id ON routes(load_id);
CREATE INDEX idx_routes_vehicle_id ON routes(vehicle_id);

-- Dispatches indexes
CREATE INDEX idx_dispatches_status ON dispatches(status);
CREATE INDEX idx_dispatches_route_id ON dispatches(route_id);
CREATE INDEX idx_dispatches_vehicle_id ON dispatches(vehicle_id);
CREATE INDEX idx_dispatches_driver_id ON dispatches(driver_id);
CREATE INDEX idx_dispatches_start_time ON dispatches(start_time);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loads_updated_at BEFORE UPDATE ON loads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dispatches_updated_at BEFORE UPDATE ON dispatches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
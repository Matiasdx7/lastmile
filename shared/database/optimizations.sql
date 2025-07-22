-- Database Optimizations for Last Mile Delivery System

-- Additional indexes for optimized queries

-- Orders table optimizations
-- Index for time window queries (useful for route planning)
CREATE INDEX IF NOT EXISTS idx_orders_time_window ON orders USING GIN (time_window);

-- Composite index for status and created_at (common query pattern)
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at);

-- Vehicles table optimizations
-- Composite index for status and type (common query pattern)
CREATE INDEX IF NOT EXISTS idx_vehicles_status_type ON vehicles(status, type);

-- Composite index for location and status (for finding available vehicles in area)
CREATE INDEX IF NOT EXISTS idx_vehicles_status_location ON vehicles(status) INCLUDE (current_location);

-- Routes table optimizations
-- Index for estimated_duration (for sorting routes by duration)
CREATE INDEX IF NOT EXISTS idx_routes_estimated_duration ON routes(estimated_duration);

-- Composite index for vehicle_id and status (common query pattern)
CREATE INDEX IF NOT EXISTS idx_routes_vehicle_id_status ON routes(vehicle_id, status);

-- Dispatches table optimizations
-- Composite index for status and start_time (for active dispatches)
CREATE INDEX IF NOT EXISTS idx_dispatches_status_start_time ON dispatches(status, start_time);

-- Composite index for driver_id and status (for driver's active dispatches)
CREATE INDEX IF NOT EXISTS idx_dispatches_driver_id_status ON dispatches(driver_id, status);

-- Loads table optimizations
-- Composite index for status and created_at (for sorting loads by creation time)
CREATE INDEX IF NOT EXISTS idx_loads_status_created_at ON loads(status, created_at);

-- Partial indexes for common query patterns

-- Partial index for pending orders (frequently queried)
CREATE INDEX IF NOT EXISTS idx_orders_pending ON orders(created_at) 
WHERE status = 'pending';

-- Partial index for available vehicles (frequently queried)
CREATE INDEX IF NOT EXISTS idx_vehicles_available ON vehicles(created_at) 
WHERE status = 'available';

-- Partial index for active dispatches (frequently queried)
CREATE INDEX IF NOT EXISTS idx_dispatches_active ON dispatches(start_time) 
WHERE status = 'active';

-- Partial index for in-progress routes (frequently queried)
CREATE INDEX IF NOT EXISTS idx_routes_in_progress ON routes(vehicle_id) 
WHERE status = 'in_progress';

-- Optimize JSONB queries with expression indexes

-- Index for package weight queries (common for load consolidation)
CREATE INDEX IF NOT EXISTS idx_orders_package_weight ON orders ((package_details->>'weight'));

-- Index for vehicle capacity queries
CREATE INDEX IF NOT EXISTS idx_vehicles_max_weight ON vehicles ((capacity->>'maxWeight'));
CREATE INDEX IF NOT EXISTS idx_vehicles_max_volume ON vehicles ((capacity->>'maxVolume'));

-- Analyze tables to update statistics for query planner
ANALYZE orders;
ANALYZE vehicles;
ANALYZE loads;
ANALYZE routes;
ANALYZE dispatches;
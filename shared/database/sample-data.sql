-- Sample data for testing the last mile delivery system

-- Insert sample vehicles
INSERT INTO vehicles (id, license_plate, type, capacity, current_location, status, driver_id) VALUES
(
    uuid_generate_v4(),
    'VAN-001',
    'van',
    '{"maxWeight": 1000, "maxVolume": 50, "maxPackages": 20}',
    '{"latitude": 37.7749, "longitude": -122.4194}',
    'available',
    'driver-001'
),
(
    uuid_generate_v4(),
    'TRUCK-001', 
    'truck',
    '{"maxWeight": 2000, "maxVolume": 100, "maxPackages": 50}',
    '{"latitude": 37.7849, "longitude": -122.4094}',
    'available',
    'driver-002'
),
(
    uuid_generate_v4(),
    'MOTO-001',
    'motorcycle',
    '{"maxWeight": 50, "maxVolume": 5, "maxPackages": 5}',
    '{"latitude": 37.7649, "longitude": -122.4294}',
    'available',
    'driver-003'
);

-- Insert sample orders
INSERT INTO orders (id, customer_id, customer_name, customer_phone, delivery_address, package_details, special_instructions, time_window, status) VALUES
(
    uuid_generate_v4(),
    'customer-001',
    'John Doe',
    '+1-555-0101',
    '{"street": "123 Main St", "city": "San Francisco", "state": "CA", "zipCode": "94102", "coordinates": {"latitude": 37.7849, "longitude": -122.4094}}',
    '[{"id": "pkg-001", "description": "Electronics", "weight": 2.5, "dimensions": {"length": 30, "width": 20, "height": 10}, "fragile": true}]',
    'Handle with care - fragile electronics',
    '{"startTime": "2024-01-15T09:00:00Z", "endTime": "2024-01-15T17:00:00Z"}',
    'pending'
),
(
    uuid_generate_v4(),
    'customer-002',
    'Jane Smith',
    '+1-555-0102',
    '{"street": "456 Oak Ave", "city": "San Francisco", "state": "CA", "zipCode": "94103", "coordinates": {"latitude": 37.7749, "longitude": -122.4194}}',
    '[{"id": "pkg-002", "description": "Books", "weight": 1.2, "dimensions": {"length": 25, "width": 15, "height": 5}, "fragile": false}]',
    'Leave at front door if no answer',
    '{"startTime": "2024-01-15T10:00:00Z", "endTime": "2024-01-15T18:00:00Z"}',
    'pending'
),
(
    uuid_generate_v4(),
    'customer-003',
    'Bob Johnson',
    '+1-555-0103',
    '{"street": "789 Pine St", "city": "San Francisco", "state": "CA", "zipCode": "94104", "coordinates": {"latitude": 37.7949, "longitude": -122.3994}}',
    '[{"id": "pkg-003", "description": "Clothing", "weight": 0.8, "dimensions": {"length": 35, "width": 25, "height": 8}, "fragile": false}]',
    null,
    '{"startTime": "2024-01-15T14:00:00Z", "endTime": "2024-01-15T20:00:00Z"}',
    'pending'
);

-- Note: Loads, routes, and dispatches would be created through the application workflow
-- These are typically not pre-populated with sample data as they represent active operations
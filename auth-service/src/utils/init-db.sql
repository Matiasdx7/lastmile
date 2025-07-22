-- Create users table if it doesn't exist
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

-- Create index on username and email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create initial admin user if not exists
-- Password: Admin123! (hashed)
INSERT INTO users (
  id, username, email, password, first_name, last_name, role, active, created_at, updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin',
  'admin@lastmile.com',
  '$2a$10$eCQYn5SBNp2SxDFOkaMwL.wdwPfHIGBIBVTCxw2sWgEMT9dSgCfHC',
  'System',
  'Administrator',
  'admin',
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (username) DO NOTHING;
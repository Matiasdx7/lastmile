import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });

// Mock database connection
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});
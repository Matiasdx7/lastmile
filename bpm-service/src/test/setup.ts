// This file contains setup code for Jest tests

// Mock the database connection
jest.mock('../../../shared/database/connection', () => ({
  query: jest.fn().mockResolvedValue({ rows: [] }),
  getClient: jest.fn().mockResolvedValue({
    query: jest.fn().mockResolvedValue({ rows: [] }),
    release: jest.fn()
  })
}));

// Mock Redis client
jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    on: jest.fn()
  })
}));

// Global beforeAll hook
beforeAll(() => {
  // Add any global setup here
});

// Global afterAll hook
afterAll(() => {
  // Add any global teardown here
});

// Global beforeEach hook
beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});

// Global afterEach hook
afterEach(() => {
  // Add any cleanup after each test
});
"use strict";
jest.mock('../../../shared/database/connection', () => ({
    query: jest.fn().mockResolvedValue({ rows: [] }),
    getClient: jest.fn().mockResolvedValue({
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn()
    })
}));
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
beforeAll(() => {
});
afterAll(() => {
});
beforeEach(() => {
    jest.clearAllMocks();
});
afterEach(() => {
});
//# sourceMappingURL=setup.js.map
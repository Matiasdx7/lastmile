"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
process.env.NODE_ENV = 'test';
process.env.PORT = '3002';
beforeAll(() => {
});
afterAll(() => {
});
beforeEach(() => {
});
afterEach(() => {
    globals_1.jest.clearAllMocks();
});
//# sourceMappingURL=setup.js.map
"use strict";
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'test_db';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
beforeAll(() => {
    console.log('Starting Order Service tests');
});
afterAll(() => {
    console.log('Completed Order Service tests');
});
//# sourceMappingURL=setup.js.map
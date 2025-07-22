"use strict";
process.env.NODE_ENV = 'test';
process.env.PORT = '3005';
process.env.SMS_API_KEY = 'test-sms-api-key';
process.env.EMAIL_API_KEY = 'test-email-api-key';
process.env.PUSH_API_KEY = 'test-push-api-key';
process.env.TWILIO_ACCOUNT_SID = 'test-account-sid';
process.env.TWILIO_AUTH_TOKEN = 'test-auth-token';
process.env.TWILIO_PHONE_NUMBER = '+15551234567';
process.env.ENABLE_SMS_QUEUE = 'false';
process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({
    type: 'service_account',
    project_id: 'test-project',
    private_key_id: 'test-key-id',
    private_key: 'test-private-key',
    client_email: 'test@example.com',
    client_id: 'test-client-id'
});
jest.spyOn(console, 'log').mockImplementation(() => { });
jest.spyOn(console, 'warn').mockImplementation(() => { });
jest.spyOn(console, 'error').mockImplementation(() => { });
beforeAll(() => {
});
afterAll(() => {
});
afterEach(() => {
    jest.clearAllMocks();
});
//# sourceMappingURL=setup.js.map
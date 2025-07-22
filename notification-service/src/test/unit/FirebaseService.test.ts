import { FirebaseService, DeviceRegistration, PushNotificationRequest } from '../../services/FirebaseService';
import { NotificationPriority, RecipientType } from '../../services/NotificationService';
// Use require instead of import for firebase-admin to avoid TypeScript errors
const admin = require('firebase-admin');

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => {
    return {
        apps: [],
        initializeApp: jest.fn(),
        credential: {
            cert: jest.fn().mockReturnValue({})
        },
        messaging: jest.fn().mockReturnValue({
            sendMulticast: jest.fn().mockResolvedValue({
                successCount: 2,
                failureCount: 1,
                responses: [
                    { success: true },
                    { success: false, error: { code: 'messaging/invalid-registration-token' } },
                    { success: true }
                ]
            }),
            send: jest.fn().mockResolvedValue('message-id-123'),
            subscribeToTopic: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0, errors: [] }),
            unsubscribeFromTopic: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0, errors: [] })
        })
    };
});

describe('FirebaseService', () => {
    let firebaseService: FirebaseService;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Mock environment variables
        process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({
            type: 'service_account',
            project_id: 'test-project',
            private_key_id: 'test-key-id',
            private_key: 'test-private-key',
            client_email: 'test@example.com',
            client_id: 'test-client-id'
        });

        // Create service instance
        firebaseService = new FirebaseService();

        // Mock console methods to prevent test output noise
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'warn').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        delete process.env.FIREBASE_SERVICE_ACCOUNT;
    });

    describe('initialization', () => {
        it('should initialize Firebase Admin SDK with service account', () => {
            // Assert
            expect(admin.initializeApp).toHaveBeenCalled();
            expect(admin.credential.cert).toHaveBeenCalled();
        });

        it('should handle initialization errors gracefully', () => {
            // Arrange
            jest.spyOn(admin, 'initializeApp').mockImplementationOnce(() => {
                throw new Error('Initialization error');
            });

            // Act
            const localFirebaseService = new FirebaseService();

            // Assert
            expect(console.error).toHaveBeenCalledWith(
                'Error initializing Firebase Admin SDK:',
                expect.any(Error)
            );
            expect((localFirebaseService as any).initialized).toBe(false);
        });
    });

    describe('device registration', () => {
        it('should register a new device', () => {
            // Arrange
            const registration: DeviceRegistration = {
                userId: 'user123',
                deviceToken: 'device-token-123',
                deviceType: 'android',
                role: 'driver',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Act
            const result = firebaseService.registerDevice(registration);

            // Assert
            expect(result).toBe(true);
            expect(admin.messaging().subscribeToTopic).toHaveBeenCalledWith(
                ['device-token-123'],
                'role-driver'
            );

            // Check that device was stored
            const tokens = firebaseService.getDeviceTokensForUser('user123');
            expect(tokens).toContain('device-token-123');
        });

        it('should update an existing device registration', () => {
            // Arrange
            const registration1: DeviceRegistration = {
                userId: 'user123',
                deviceToken: 'device-token-123',
                deviceType: 'android',
                role: 'driver',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const registration2: DeviceRegistration = {
                userId: 'user123',
                deviceToken: 'device-token-123',
                deviceType: 'ios', // Changed device type
                role: 'coordinator', // Changed role
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Act
            firebaseService.registerDevice(registration1);
            const result = firebaseService.registerDevice(registration2);

            // Assert
            expect(result).toBe(true);

            // Check that device was updated
            const tokens = firebaseService.getDeviceTokensForUser('user123');
            expect(tokens).toContain('device-token-123');
            expect(tokens.length).toBe(1); // Only one device

            // Check that role was updated
            const roleTokens = firebaseService.getDeviceTokensForRole('coordinator');
            expect(roleTokens).toContain('device-token-123');

            const driverTokens = firebaseService.getDeviceTokensForRole('driver');
            expect(driverTokens).not.toContain('device-token-123');
        });

        it('should handle registration errors gracefully', () => {
            // Arrange
            jest.spyOn(admin.messaging(), 'subscribeToTopic').mockRejectedValueOnce(new Error('Subscription error'));

            const registration: DeviceRegistration = {
                userId: 'user123',
                deviceToken: 'device-token-123',
                deviceType: 'android',
                role: 'driver',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Act
            const result = firebaseService.registerDevice(registration);

            // Assert
            expect(result).toBe(true); // Still returns true because device is registered locally
            expect(console.error).toHaveBeenCalledWith('Error subscribing to topic:', expect.any(Error));

            // Check that device was stored despite the error
            const tokens = firebaseService.getDeviceTokensForUser('user123');
            expect(tokens).toContain('device-token-123');
        });
    });

    describe('device unregistration', () => {
        it('should unregister a device', () => {
            // Arrange
            const registration: DeviceRegistration = {
                userId: 'user123',
                deviceToken: 'device-token-123',
                deviceType: 'android',
                role: 'driver',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            firebaseService.registerDevice(registration);

            // Act
            const result = firebaseService.unregisterDevice('device-token-123');

            // Assert
            expect(result).toBe(true);

            // Check that device was removed
            const tokens = firebaseService.getDeviceTokensForUser('user123');
            expect(tokens).not.toContain('device-token-123');
            expect(tokens.length).toBe(0);
        });

        it('should return false when device token is not found', () => {
            // Act
            const result = firebaseService.unregisterDevice('non-existent-token');

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('device token retrieval', () => {
        beforeEach(() => {
            // Register test devices
            firebaseService.registerDevice({
                userId: 'user1',
                deviceToken: 'device-token-1',
                deviceType: 'android',
                role: 'driver',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            firebaseService.registerDevice({
                userId: 'user2',
                deviceToken: 'device-token-2',
                deviceType: 'ios',
                role: 'coordinator',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            firebaseService.registerDevice({
                userId: 'user3',
                deviceToken: 'device-token-3',
                deviceType: 'web',
                role: 'admin',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            firebaseService.registerDevice({
                userId: 'user4',
                deviceToken: 'device-token-4',
                deviceType: 'android',
                role: 'driver',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        });

        it('should get device tokens for a specific user', () => {
            // Act
            const tokens = firebaseService.getDeviceTokensForUser('user1');

            // Assert
            expect(tokens).toEqual(['device-token-1']);
        });

        it('should get device tokens for a specific role', () => {
            // Act
            const driverTokens = firebaseService.getDeviceTokensForRole('driver');

            // Assert
            expect(driverTokens).toContain('device-token-1');
            expect(driverTokens).toContain('device-token-4');
            expect(driverTokens.length).toBe(2);
        });

        it('should get device tokens for recipient types', () => {
            // Act
            const tokens = firebaseService.getDeviceTokensForRecipients([
                RecipientType.DRIVER,
                RecipientType.ADMIN
            ]);

            // Assert
            expect(tokens).toContain('device-token-1');
            expect(tokens).toContain('device-token-3');
            expect(tokens).toContain('device-token-4');
            expect(tokens.length).toBe(3);
        });

        it('should get device tokens for a specific user and recipient types', () => {
            // Act
            const tokens = firebaseService.getDeviceTokensForRecipients(
                [RecipientType.COORDINATOR],
                'user1'
            );

            // Assert
            expect(tokens).toContain('device-token-1'); // User's token
            expect(tokens).toContain('device-token-2'); // Coordinator's token
            expect(tokens.length).toBe(2);
        });
    });

    describe('push notification sending', () => {
        it('should send push notification to specific devices', async () => {
            // Arrange
            const request: PushNotificationRequest = {
                title: 'Test Title',
                body: 'Test Body',
                data: { key: 'value' },
                tokens: ['token1', 'token2', 'token3'],
                priority: NotificationPriority.HIGH
            };

            // Act
            const result = await firebaseService.sendPushNotification(request);

            // Assert
            expect(result).toBe(true);
            expect(admin.messaging().sendMulticast).toHaveBeenCalledWith(
                expect.objectContaining({
                    notification: {
                        title: 'Test Title',
                        body: 'Test Body'
                    },
                    data: { key: 'value' },
                    tokens: ['token1', 'token2', 'token3']
                })
            );
        });

        it('should send push notification to a topic', async () => {
            // Arrange
            const request: PushNotificationRequest = {
                title: 'Test Title',
                body: 'Test Body',
                data: { key: 'value' },
                tokens: [],
                topic: 'test-topic'
            };

            // Act
            const result = await firebaseService.sendPushNotification(request);

            // Assert
            expect(result).toBe(true);
            expect(admin.messaging().send).toHaveBeenCalledWith(
                expect.objectContaining({
                    notification: {
                        title: 'Test Title',
                        body: 'Test Body'
                    },
                    data: { key: 'value' },
                    topic: 'test-topic'
                })
            );
        });

        it('should return false when no tokens or topic is provided', async () => {
            // Arrange
            const request: PushNotificationRequest = {
                title: 'Test Title',
                body: 'Test Body',
                data: { key: 'value' },
                tokens: []
            };

            // Act
            const result = await firebaseService.sendPushNotification(request);

            // Assert
            expect(result).toBe(false);
            expect(admin.messaging().sendMulticast).not.toHaveBeenCalled();
            expect(admin.messaging().send).not.toHaveBeenCalled();
        });

        it('should handle send errors gracefully', async () => {
            // Arrange
            jest.spyOn(admin.messaging(), 'sendMulticast').mockRejectedValueOnce(new Error('Send error'));

            const request: PushNotificationRequest = {
                title: 'Test Title',
                body: 'Test Body',
                data: { key: 'value' },
                tokens: ['token1', 'token2']
            };

            // Act
            const result = await firebaseService.sendPushNotification(request);

            // Assert
            expect(result).toBe(false);
            expect(console.error).toHaveBeenCalledWith('Error sending push notification:', expect.any(Error));
        });

        it('should mock push notification sending when Firebase is not initialized', async () => {
            // Arrange
            (firebaseService as any).initialized = false;

            const request: PushNotificationRequest = {
                title: 'Test Title',
                body: 'Test Body',
                data: { key: 'value' },
                tokens: ['token1', 'token2']
            };

            // Act
            const result = await firebaseService.sendPushNotification(request);

            // Assert
            expect(result).toBe(true);
            expect(console.warn).toHaveBeenCalledWith('Firebase Admin SDK not initialized. Push notification will be mocked.');
            expect(admin.messaging().sendMulticast).not.toHaveBeenCalled();
        });
    });

    describe('topic notification sending', () => {
        it('should send notification to a topic', async () => {
            // Act
            const result = await firebaseService.sendTopicNotification(
                'test-topic',
                'Test Title',
                'Test Body',
                { key: 'value' },
                NotificationPriority.MEDIUM
            );

            // Assert
            expect(result).toBe(true);
            expect(admin.messaging().send).toHaveBeenCalledWith(
                expect.objectContaining({
                    notification: {
                        title: 'Test Title',
                        body: 'Test Body'
                    },
                    data: { key: 'value' },
                    topic: 'test-topic'
                })
            );
        });

        it('should send notification to a role', async () => {
            // Act
            const result = await firebaseService.sendRoleNotification(
                'driver',
                'Test Title',
                'Test Body',
                { key: 'value' },
                NotificationPriority.HIGH
            );

            // Assert
            expect(result).toBe(true);
            expect(admin.messaging().send).toHaveBeenCalledWith(
                expect.objectContaining({
                    notification: {
                        title: 'Test Title',
                        body: 'Test Body'
                    },
                    data: { key: 'value' },
                    topic: 'role-driver'
                })
            );
        });
    });
});
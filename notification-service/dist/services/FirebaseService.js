"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseService = void 0;
const admin = require('firebase-admin');
const NotificationService_1 = require("./NotificationService");
class FirebaseService {
    constructor() {
        this.initialized = false;
        this.deviceTokens = new Map();
        try {
            if (admin.apps.length === 0) {
                const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
                    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
                    : undefined;
                if (serviceAccount) {
                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount)
                    });
                    this.initialized = true;
                }
                else {
                    admin.initializeApp();
                    this.initialized = true;
                }
            }
            else {
                this.initialized = true;
            }
        }
        catch (error) {
            console.error('Error initializing Firebase Admin SDK:', error);
            this.initialized = false;
        }
    }
    registerDevice(registration) {
        try {
            const { userId, deviceToken, deviceType, role } = registration;
            const userDevices = this.deviceTokens.get(userId) || [];
            const existingDeviceIndex = userDevices.findIndex(device => device.deviceToken === deviceToken);
            if (existingDeviceIndex >= 0) {
                userDevices[existingDeviceIndex] = {
                    ...registration,
                    updatedAt: new Date()
                };
            }
            else {
                userDevices.push({
                    ...registration,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
            this.deviceTokens.set(userId, userDevices);
            if (this.initialized) {
                admin.messaging().subscribeToTopic([deviceToken], `role-${role}`)
                    .then(() => console.log(`Device ${deviceToken} subscribed to topic role-${role}`))
                    .catch((error) => console.error('Error subscribing to topic:', error));
            }
            return true;
        }
        catch (error) {
            console.error('Error registering device:', error);
            return false;
        }
    }
    unregisterDevice(deviceToken) {
        try {
            for (const [userId, devices] of this.deviceTokens.entries()) {
                const deviceIndex = devices.findIndex(device => device.deviceToken === deviceToken);
                if (deviceIndex >= 0) {
                    devices.splice(deviceIndex, 1);
                    if (devices.length > 0) {
                        this.deviceTokens.set(userId, devices);
                    }
                    else {
                        this.deviceTokens.delete(userId);
                    }
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            console.error('Error unregistering device:', error);
            return false;
        }
    }
    getDeviceTokensForUser(userId) {
        const userDevices = this.deviceTokens.get(userId) || [];
        return userDevices.map(device => device.deviceToken);
    }
    getDeviceTokensForRole(role) {
        const tokens = [];
        for (const devices of this.deviceTokens.values()) {
            devices.forEach(device => {
                if (device.role === role) {
                    tokens.push(device.deviceToken);
                }
            });
        }
        return tokens;
    }
    getDeviceTokensForRecipients(recipientTypes, specificUserId) {
        const tokens = new Set();
        if (specificUserId) {
            const userTokens = this.getDeviceTokensForUser(specificUserId);
            userTokens.forEach(token => tokens.add(token));
        }
        recipientTypes.forEach(recipientType => {
            let roleTokens = [];
            switch (recipientType) {
                case NotificationService_1.RecipientType.DRIVER:
                    roleTokens = this.getDeviceTokensForRole('driver');
                    break;
                case NotificationService_1.RecipientType.COORDINATOR:
                    roleTokens = this.getDeviceTokensForRole('coordinator');
                    break;
                case NotificationService_1.RecipientType.ADMIN:
                    roleTokens = this.getDeviceTokensForRole('admin');
                    break;
                case NotificationService_1.RecipientType.CUSTOMER:
                    break;
            }
            roleTokens.forEach(token => tokens.add(token));
        });
        return Array.from(tokens);
    }
    async sendPushNotification(request) {
        try {
            if (!this.initialized) {
                console.warn('Firebase Admin SDK not initialized. Push notification will be mocked.');
                console.log(`[MOCK] Sending push notification to ${request.tokens.length} devices:`, {
                    title: request.title,
                    body: request.body,
                    data: request.data
                });
                return true;
            }
            if (!request.tokens || request.tokens.length === 0) {
                if (!request.topic) {
                    console.warn('No device tokens or topic provided for push notification');
                    return false;
                }
            }
            const priority = request.priority === NotificationService_1.NotificationPriority.HIGH ||
                request.priority === NotificationService_1.NotificationPriority.CRITICAL
                ? 'high'
                : 'normal';
            const message = {
                notification: {
                    title: request.title,
                    body: request.body
                },
                data: request.data,
                android: {
                    priority,
                    notification: {
                        sound: 'default',
                        priority: priority === 'high' ? 'max' : 'default'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1
                        }
                    }
                },
                tokens: request.tokens
            };
            if (request.tokens && request.tokens.length > 0) {
                const response = await admin.messaging().sendMulticast(message);
                console.log(`Successfully sent message to ${response.successCount} devices`);
                if (response.failureCount > 0) {
                    const failedTokens = [];
                    response.responses.forEach((resp, idx) => {
                        if (!resp.success) {
                            failedTokens.push(request.tokens[idx]);
                            console.error('Error sending message to device:', resp.error);
                        }
                    });
                    console.error(`Failed to send message to ${failedTokens.length} devices:`, failedTokens);
                }
                return response.successCount > 0;
            }
            else if (request.topic) {
                const topicMessage = {
                    notification: {
                        title: request.title,
                        body: request.body
                    },
                    data: request.data,
                    android: message.android,
                    apns: message.apns,
                    topic: request.topic
                };
                const response = await admin.messaging().send(topicMessage);
                console.log(`Successfully sent message to topic ${request.topic}:`, response);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Error sending push notification:', error);
            return false;
        }
    }
    async sendTopicNotification(topic, title, body, data = {}, priority = NotificationService_1.NotificationPriority.MEDIUM) {
        return this.sendPushNotification({
            title,
            body,
            data,
            tokens: [],
            priority,
            topic
        });
    }
    async sendRoleNotification(role, title, body, data = {}, priority = NotificationService_1.NotificationPriority.MEDIUM) {
        return this.sendTopicNotification(`role-${role}`, title, body, data, priority);
    }
}
exports.FirebaseService = FirebaseService;
//# sourceMappingURL=FirebaseService.js.map
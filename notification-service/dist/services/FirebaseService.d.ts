import { NotificationPriority, RecipientType } from './NotificationService';
export interface PushNotificationRequest {
    title: string;
    body: string;
    data: Record<string, string>;
    tokens: string[];
    priority?: NotificationPriority;
    topic?: string;
}
export interface DeviceRegistration {
    userId: string;
    deviceToken: string;
    deviceType: 'ios' | 'android' | 'web';
    role: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class FirebaseService {
    private initialized;
    private deviceTokens;
    constructor();
    registerDevice(registration: DeviceRegistration): boolean;
    unregisterDevice(deviceToken: string): boolean;
    getDeviceTokensForUser(userId: string): string[];
    getDeviceTokensForRole(role: string): string[];
    getDeviceTokensForRecipients(recipientTypes: RecipientType[], specificUserId?: string): string[];
    sendPushNotification(request: PushNotificationRequest): Promise<boolean>;
    sendTopicNotification(topic: string, title: string, body: string, data?: Record<string, string>, priority?: NotificationPriority): Promise<boolean>;
    sendRoleNotification(role: string, title: string, body: string, data?: Record<string, string>, priority?: NotificationPriority): Promise<boolean>;
}
//# sourceMappingURL=FirebaseService.d.ts.map
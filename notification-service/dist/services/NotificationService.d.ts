export declare enum NotificationType {
    SMS = "sms",
    EMAIL = "email",
    PUSH = "push",
    WEBSOCKET = "websocket"
}
export declare enum RecipientType {
    CUSTOMER = "customer",
    COORDINATOR = "coordinator",
    DRIVER = "driver",
    ADMIN = "admin"
}
export declare enum NotificationPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface NotificationRequest {
    orderId: string;
    dispatchId?: string;
    status: 'delivered' | 'failed' | 'delayed' | 'in_transit';
    customerName: string;
    customerPhone: string;
    deliveryAddress: any;
    timestamp: string;
    details: any;
    recipientTypes?: RecipientType[];
    notificationTypes?: NotificationType[];
    priority?: NotificationPriority;
}
export declare class NotificationService {
    private smsApiKey;
    private emailApiKey;
    private pushApiKey;
    private twilioService;
    private firebaseService;
    constructor();
    processNotification(notification: NotificationRequest): Promise<boolean>;
    private sendSmsNotifications;
    private sendCustomSmsNotifications;
    private sendEmailNotifications;
    private sendPushNotifications;
    private getPushNotificationType;
    private sendWebSocketNotifications;
    private getRecipientPhoneNumbers;
    private getRecipientEmailAddresses;
    private getRecipientDeviceTokens;
    private generateSmsMessage;
    private generateEmailSubject;
    private generateEmailBody;
    private generatePushTitle;
    private generatePushBody;
}
//# sourceMappingURL=NotificationService.d.ts.map
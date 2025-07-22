"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = exports.NotificationPriority = exports.RecipientType = exports.NotificationType = void 0;
const TwilioService_1 = require("./TwilioService");
const FirebaseService_1 = require("./FirebaseService");
var NotificationType;
(function (NotificationType) {
    NotificationType["SMS"] = "sms";
    NotificationType["EMAIL"] = "email";
    NotificationType["PUSH"] = "push";
    NotificationType["WEBSOCKET"] = "websocket";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var RecipientType;
(function (RecipientType) {
    RecipientType["CUSTOMER"] = "customer";
    RecipientType["COORDINATOR"] = "coordinator";
    RecipientType["DRIVER"] = "driver";
    RecipientType["ADMIN"] = "admin";
})(RecipientType || (exports.RecipientType = RecipientType = {}));
var NotificationPriority;
(function (NotificationPriority) {
    NotificationPriority["LOW"] = "low";
    NotificationPriority["MEDIUM"] = "medium";
    NotificationPriority["HIGH"] = "high";
    NotificationPriority["CRITICAL"] = "critical";
})(NotificationPriority || (exports.NotificationPriority = NotificationPriority = {}));
class NotificationService {
    constructor() {
        this.smsApiKey = process.env.SMS_API_KEY || 'mock-sms-api-key';
        this.emailApiKey = process.env.EMAIL_API_KEY || 'mock-email-api-key';
        this.pushApiKey = process.env.PUSH_API_KEY || 'mock-push-api-key';
        this.twilioService = new TwilioService_1.TwilioService();
        this.firebaseService = new FirebaseService_1.FirebaseService();
    }
    async processNotification(notification) {
        try {
            const notificationTypes = notification.notificationTypes || [
                NotificationType.SMS,
                NotificationType.EMAIL,
                NotificationType.PUSH
            ];
            const recipientTypes = notification.recipientTypes || [
                RecipientType.CUSTOMER,
                RecipientType.COORDINATOR
            ];
            const priority = notification.priority ||
                (notification.status === 'failed' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM);
            const results = await Promise.allSettled(notificationTypes.map(type => {
                switch (type) {
                    case NotificationType.SMS:
                        return this.sendSmsNotifications(notification, recipientTypes, priority);
                    case NotificationType.EMAIL:
                        return this.sendEmailNotifications(notification, recipientTypes, priority);
                    case NotificationType.PUSH:
                        return this.sendPushNotifications(notification, recipientTypes, priority);
                    case NotificationType.WEBSOCKET:
                        return this.sendWebSocketNotifications(notification, recipientTypes, priority);
                    default:
                        return Promise.resolve(false);
                }
            }));
            const successfulNotifications = results.filter(result => result.status === 'fulfilled' && result.value);
            return successfulNotifications.length > 0;
        }
        catch (error) {
            console.error('Error processing notification:', error);
            return false;
        }
    }
    async sendSmsNotifications(notification, recipientTypes, priority) {
        try {
            const phoneNumbers = await this.getRecipientPhoneNumbers(notification, recipientTypes);
            if (phoneNumbers.length === 0) {
                console.log('No phone numbers found for SMS notification');
                return false;
            }
            let templateName;
            const variables = {
                orderId: notification.orderId
            };
            switch (notification.status) {
                case 'delivered':
                    templateName = 'delivery_success';
                    break;
                case 'failed':
                    templateName = 'delivery_failed';
                    variables.reason = notification.details?.reason || 'unknown reason';
                    variables.nextAction = notification.details?.nextAction === 'retry_later'
                        ? 'We will attempt delivery again soon.'
                        : 'The package will be returned to our depot.';
                    break;
                case 'delayed':
                    templateName = 'delivery_delayed';
                    variables.delay = notification.details?.estimatedDelay || 'some';
                    break;
                case 'in_transit':
                    templateName = 'delivery_in_transit';
                    break;
                default:
                    return this.sendCustomSmsNotifications(notification, phoneNumbers);
            }
            if (priority === NotificationPriority.HIGH || priority === NotificationPriority.CRITICAL) {
                const result = await this.twilioService.bulkSendSmsWithTemplate(phoneNumbers, templateName, variables);
                return result.success > 0;
            }
            else {
                let success = false;
                for (const phoneNumber of phoneNumbers) {
                    const result = await this.twilioService.sendSmsWithTemplate({
                        to: phoneNumber,
                        templateName,
                        variables
                    });
                    if (result) {
                        success = true;
                    }
                }
                return success;
            }
        }
        catch (error) {
            console.error('Error sending SMS notifications:', error);
            return false;
        }
    }
    async sendCustomSmsNotifications(notification, phoneNumbers) {
        try {
            const message = this.generateSmsMessage(notification);
            const result = await this.twilioService.bulkSendSms(phoneNumbers, message);
            return result.success > 0;
        }
        catch (error) {
            console.error('Error sending custom SMS notifications:', error);
            return false;
        }
    }
    async sendEmailNotifications(notification, recipientTypes, priority) {
        try {
            const emailAddresses = await this.getRecipientEmailAddresses(notification, recipientTypes);
            if (emailAddresses.length === 0) {
                console.log('No email addresses found for email notification');
                return false;
            }
            const subject = this.generateEmailSubject(notification);
            const body = this.generateEmailBody(notification);
            console.log(`[MOCK] Sending email to ${emailAddresses.length} recipients: ${subject}`);
            return true;
        }
        catch (error) {
            console.error('Error sending email notifications:', error);
            return false;
        }
    }
    async sendPushNotifications(notification, recipientTypes, priority) {
        try {
            const deviceTokens = await this.getRecipientDeviceTokens(notification, recipientTypes);
            if (deviceTokens.length === 0) {
                console.log('No device tokens found for push notification');
                return false;
            }
            const title = this.generatePushTitle(notification);
            const body = this.generatePushBody(notification);
            const data = {
                orderId: notification.orderId,
                status: notification.status,
                timestamp: notification.timestamp,
                type: this.getPushNotificationType(notification),
                clickAction: 'OPEN_ORDER_DETAIL'
            };
            if (notification.dispatchId) {
                data.dispatchId = notification.dispatchId;
            }
            const result = await this.firebaseService.sendPushNotification({
                title,
                body,
                data,
                tokens: deviceTokens,
                priority
            });
            return result;
        }
        catch (error) {
            console.error('Error sending push notifications:', error);
            return false;
        }
    }
    getPushNotificationType(notification) {
        switch (notification.status) {
            case 'delivered':
                return 'delivery_completed';
            case 'failed':
                return 'delivery_failed';
            case 'delayed':
                return 'delivery_delayed';
            case 'in_transit':
                return 'delivery_in_transit';
            default:
                return 'delivery_update';
        }
    }
    async sendWebSocketNotifications(notification, recipientTypes, priority) {
        try {
            console.log(`[MOCK] Broadcasting WebSocket notification: ${notification.status}`);
            return true;
        }
        catch (error) {
            console.error('Error sending WebSocket notifications:', error);
            return false;
        }
    }
    async getRecipientPhoneNumbers(notification, recipientTypes) {
        const phoneNumbers = [];
        if (recipientTypes.includes(RecipientType.CUSTOMER) && notification.customerPhone) {
            phoneNumbers.push(notification.customerPhone);
        }
        if (recipientTypes.includes(RecipientType.COORDINATOR)) {
            phoneNumbers.push('+15551234567');
        }
        if (recipientTypes.includes(RecipientType.ADMIN)) {
            phoneNumbers.push('+15559876543');
        }
        return phoneNumbers;
    }
    async getRecipientEmailAddresses(notification, recipientTypes) {
        const emailAddresses = [];
        if (recipientTypes.includes(RecipientType.CUSTOMER)) {
            emailAddresses.push('customer@example.com');
        }
        if (recipientTypes.includes(RecipientType.COORDINATOR)) {
            emailAddresses.push('coordinator@lastmiledelivery.com');
        }
        if (recipientTypes.includes(RecipientType.ADMIN)) {
            emailAddresses.push('admin@lastmiledelivery.com');
        }
        return emailAddresses;
    }
    async getRecipientDeviceTokens(notification, recipientTypes) {
        const deviceTokens = [];
        if (recipientTypes.includes(RecipientType.CUSTOMER)) {
            deviceTokens.push('customer-device-token-123');
        }
        if (recipientTypes.includes(RecipientType.COORDINATOR)) {
            deviceTokens.push('coordinator-device-token-456');
        }
        if (recipientTypes.includes(RecipientType.ADMIN)) {
            deviceTokens.push('admin-device-token-789');
        }
        return deviceTokens;
    }
    generateSmsMessage(notification) {
        const { status, orderId, customerName } = notification;
        switch (status) {
            case 'delivered':
                return `Your order #${orderId} has been delivered successfully. Thank you for using our service!`;
            case 'failed':
                const reason = notification.details?.reason || 'unknown reason';
                const nextAction = notification.details?.nextAction === 'retry_later'
                    ? 'We will attempt delivery again soon.'
                    : 'The package will be returned to our depot.';
                return `Delivery attempt for order #${orderId} was unsuccessful due to ${reason}. ${nextAction} Contact support for assistance.`;
            case 'delayed':
                const delayMinutes = notification.details?.estimatedDelay || 'some';
                return `Your delivery for order #${orderId} is delayed by approximately ${delayMinutes} minutes. We apologize for the inconvenience.`;
            case 'in_transit':
                return `Your order #${orderId} is now out for delivery. Track your delivery in real-time on our app.`;
            default:
                return `Update for your order #${orderId}: Status is now ${status}.`;
        }
    }
    generateEmailSubject(notification) {
        const { status, orderId } = notification;
        switch (status) {
            case 'delivered':
                return `Order #${orderId} Delivered Successfully`;
            case 'failed':
                return `Delivery Attempt Unsuccessful for Order #${orderId}`;
            case 'delayed':
                return `Delivery Delay Notice for Order #${orderId}`;
            case 'in_transit':
                return `Order #${orderId} Out for Delivery`;
            default:
                return `Order #${orderId} Status Update: ${status}`;
        }
    }
    generateEmailBody(notification) {
        const { status, orderId, customerName, deliveryAddress, timestamp, details } = notification;
        const formattedDate = new Date(timestamp).toLocaleString();
        let body = `<html><body>`;
        body += `<h2>Delivery Update</h2>`;
        body += `<p>Dear ${customerName},</p>`;
        switch (status) {
            case 'delivered':
                body += `<p>We're pleased to inform you that your order #${orderId} has been delivered successfully on ${formattedDate}.</p>`;
                if (details?.signature) {
                    body += `<p>The delivery was confirmed with a signature.</p>`;
                }
                if (details?.notes) {
                    body += `<p>Delivery notes: ${details.notes}</p>`;
                }
                body += `<p>Thank you for choosing our delivery service!</p>`;
                break;
            case 'failed':
                const reason = details?.reason || 'unknown reason';
                body += `<p>We attempted to deliver your order #${orderId} on ${formattedDate}, but were unable to complete the delivery due to: <strong>${reason}</strong>.</p>`;
                if (details?.nextAction === 'retry_later') {
                    body += `<p>We will attempt to deliver your package again soon.</p>`;
                }
                else {
                    body += `<p>The package will be returned to our depot. Please contact customer support to arrange redelivery.</p>`;
                }
                if (details?.notes) {
                    body += `<p>Additional notes: ${details.notes}</p>`;
                }
                break;
            case 'delayed':
                const delayMinutes = details?.estimatedDelay || 'some';
                body += `<p>We wanted to inform you that your delivery for order #${orderId} is experiencing a delay of approximately ${delayMinutes} minutes.</p>`;
                body += `<p>We apologize for any inconvenience this may cause and are working to get your package to you as soon as possible.</p>`;
                break;
            case 'in_transit':
                body += `<p>Your order #${orderId} is now out for delivery to:</p>`;
                body += `<p>${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state} ${deliveryAddress.zipCode}</p>`;
                body += `<p>You can track your delivery in real-time on our mobile app or website.</p>`;
                break;
            default:
                body += `<p>This is an update for your order #${orderId}. The current status is: ${status}.</p>`;
        }
        body += `<p>If you have any questions or concerns, please contact our customer support team.</p>`;
        body += `<p>Best regards,<br>Last Mile Delivery Team</p>`;
        body += `</body></html>`;
        return body;
    }
    generatePushTitle(notification) {
        const { status, orderId } = notification;
        switch (status) {
            case 'delivered':
                return `Order #${orderId} Delivered`;
            case 'failed':
                return `Delivery Attempt Failed`;
            case 'delayed':
                return `Delivery Delay Notice`;
            case 'in_transit':
                return `Order Out for Delivery`;
            default:
                return `Order Status Update`;
        }
    }
    generatePushBody(notification) {
        const { status, orderId } = notification;
        switch (status) {
            case 'delivered':
                return `Your order #${orderId} has been delivered successfully.`;
            case 'failed':
                const reason = notification.details?.reason || 'unknown reason';
                return `Delivery attempt for order #${orderId} failed due to ${reason}.`;
            case 'delayed':
                const delayMinutes = notification.details?.estimatedDelay || 'some';
                return `Your delivery is delayed by approximately ${delayMinutes} minutes.`;
            case 'in_transit':
                return `Your order #${orderId} is now out for delivery.`;
            default:
                return `Your order #${orderId} status is now ${status}.`;
        }
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=NotificationService.js.map
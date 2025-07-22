import axios from 'axios';
import { TwilioService } from './TwilioService';
import { FirebaseService } from './FirebaseService';

/**
 * Notification types
 */
export enum NotificationType {
  SMS = 'sms',
  EMAIL = 'email',
  PUSH = 'push',
  WEBSOCKET = 'websocket'
}

/**
 * Notification recipient types
 */
export enum RecipientType {
  CUSTOMER = 'customer',
  COORDINATOR = 'coordinator',
  DRIVER = 'driver',
  ADMIN = 'admin'
}

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Notification request interface
 */
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

/**
 * Service for handling notifications
 */
export class NotificationService {
  private smsApiKey: string;
  private emailApiKey: string;
  private pushApiKey: string;
  private twilioService: TwilioService;
  private firebaseService: FirebaseService;
  
  constructor() {
    // In a real implementation, these would be loaded from environment variables
    this.smsApiKey = process.env.SMS_API_KEY || 'mock-sms-api-key';
    this.emailApiKey = process.env.EMAIL_API_KEY || 'mock-email-api-key';
    this.pushApiKey = process.env.PUSH_API_KEY || 'mock-push-api-key';
    
    // Initialize services
    this.twilioService = new TwilioService();
    this.firebaseService = new FirebaseService();
  }
  
  /**
   * Process a notification request
   */
  async processNotification(notification: NotificationRequest): Promise<boolean> {
    try {
      // Determine notification types if not specified
      const notificationTypes = notification.notificationTypes || [
        NotificationType.SMS,
        NotificationType.EMAIL,
        NotificationType.PUSH
      ];
      
      // Determine recipient types if not specified
      const recipientTypes = notification.recipientTypes || [
        RecipientType.CUSTOMER,
        RecipientType.COORDINATOR
      ];
      
      // Determine priority if not specified
      const priority = notification.priority || 
        (notification.status === 'failed' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM);
      
      // Process each notification type
      const results = await Promise.allSettled(
        notificationTypes.map(type => {
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
        })
      );
      
      // Check if at least one notification was sent successfully
      const successfulNotifications = results.filter(result => result.status === 'fulfilled' && result.value);
      
      return successfulNotifications.length > 0;
    } catch (error) {
      console.error('Error processing notification:', error);
      return false;
    }
  }
  
  /**
   * Send SMS notifications
   */
  private async sendSmsNotifications(
    notification: NotificationRequest,
    recipientTypes: RecipientType[],
    priority: NotificationPriority
  ): Promise<boolean> {
    try {
      // Get recipients phone numbers
      const phoneNumbers = await this.getRecipientPhoneNumbers(notification, recipientTypes);
      
      if (phoneNumbers.length === 0) {
        console.log('No phone numbers found for SMS notification');
        return false;
      }
      
      // Determine which template to use based on notification status
      let templateName: string;
      const variables: Record<string, string | number> = {
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
          // Fallback to custom message if no template matches
          return this.sendCustomSmsNotifications(notification, phoneNumbers);
      }
      
      // Use Twilio service to send templated SMS
      if (priority === NotificationPriority.HIGH || priority === NotificationPriority.CRITICAL) {
        // For high priority notifications, send immediately to each recipient
        const result = await this.twilioService.bulkSendSmsWithTemplate(
          phoneNumbers,
          templateName,
          variables
        );
        
        return result.success > 0;
      } else {
        // For normal priority, use the queue system
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
    } catch (error) {
      console.error('Error sending SMS notifications:', error);
      return false;
    }
  }
  
  /**
   * Send custom SMS notifications (fallback when no template matches)
   */
  private async sendCustomSmsNotifications(
    notification: NotificationRequest,
    phoneNumbers: string[]
  ): Promise<boolean> {
    try {
      // Generate custom SMS message
      const message = this.generateSmsMessage(notification);
      
      // Use Twilio service to send custom SMS
      const result = await this.twilioService.bulkSendSms(phoneNumbers, message);
      
      return result.success > 0;
    } catch (error) {
      console.error('Error sending custom SMS notifications:', error);
      return false;
    }
  }
  
  /**
   * Send email notifications
   */
  private async sendEmailNotifications(
    notification: NotificationRequest,
    recipientTypes: RecipientType[],
    priority: NotificationPriority
  ): Promise<boolean> {
    try {
      // Get recipients email addresses
      const emailAddresses = await this.getRecipientEmailAddresses(notification, recipientTypes);
      
      if (emailAddresses.length === 0) {
        console.log('No email addresses found for email notification');
        return false;
      }
      
      // Generate email subject and body
      const subject = this.generateEmailSubject(notification);
      const body = this.generateEmailBody(notification);
      
      // In a real implementation, we would use a service like SendGrid
      console.log(`[MOCK] Sending email to ${emailAddresses.length} recipients: ${subject}`);
      
      // Simulate API call to email provider
      // In a real implementation, we would use axios.post to call the email API
      /*
      await axios.post('https://api.sendgrid.com/v3/mail/send', {
        personalizations: [{
          to: emailAddresses.map(email => ({ email }))
        }],
        from: { email: 'notifications@lastmiledelivery.com', name: 'Last Mile Delivery' },
        subject,
        content: [{ type: 'text/html', value: body }]
      }, {
        headers: {
          Authorization: `Bearer ${this.emailApiKey}`
        }
      });
      */
      
      return true;
    } catch (error) {
      console.error('Error sending email notifications:', error);
      return false;
    }
  }
  
  /**
   * Send push notifications
   */
  private async sendPushNotifications(
    notification: NotificationRequest,
    recipientTypes: RecipientType[],
    priority: NotificationPriority
  ): Promise<boolean> {
    try {
      // Get recipients device tokens
      const deviceTokens = await this.getRecipientDeviceTokens(notification, recipientTypes);
      
      if (deviceTokens.length === 0) {
        console.log('No device tokens found for push notification');
        return false;
      }
      
      // Generate push notification title and body
      const title = this.generatePushTitle(notification);
      const body = this.generatePushBody(notification);
      
      // Prepare data payload
      const data: Record<string, string> = {
        orderId: notification.orderId,
        status: notification.status,
        timestamp: notification.timestamp,
        type: this.getPushNotificationType(notification),
        clickAction: 'OPEN_ORDER_DETAIL'
      };
      
      // Add additional data if available
      if (notification.dispatchId) {
        data.dispatchId = notification.dispatchId;
      }
      
      // Use Firebase service to send push notification
      const result = await this.firebaseService.sendPushNotification({
        title,
        body,
        data,
        tokens: deviceTokens,
        priority
      });
      
      return result;
    } catch (error) {
      console.error('Error sending push notifications:', error);
      return false;
    }
  }
  
  /**
   * Get push notification type based on notification
   */
  private getPushNotificationType(notification: NotificationRequest): string {
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
  
  /**
   * Send WebSocket notifications
   */
  private async sendWebSocketNotifications(
    notification: NotificationRequest,
    recipientTypes: RecipientType[],
    priority: NotificationPriority
  ): Promise<boolean> {
    try {
      // In a real implementation, we would use a WebSocket server
      console.log(`[MOCK] Broadcasting WebSocket notification: ${notification.status}`);
      
      // Simulate WebSocket broadcast
      // In a real implementation, we would use a WebSocket library to broadcast the notification
      
      return true;
    } catch (error) {
      console.error('Error sending WebSocket notifications:', error);
      return false;
    }
  }
  
  /**
   * Get recipient phone numbers based on recipient types
   */
  private async getRecipientPhoneNumbers(
    notification: NotificationRequest,
    recipientTypes: RecipientType[]
  ): Promise<string[]> {
    const phoneNumbers: string[] = [];
    
    // Add customer phone number if customer is a recipient
    if (recipientTypes.includes(RecipientType.CUSTOMER) && notification.customerPhone) {
      phoneNumbers.push(notification.customerPhone);
    }
    
    // In a real implementation, we would fetch coordinator and admin phone numbers from a database
    if (recipientTypes.includes(RecipientType.COORDINATOR)) {
      phoneNumbers.push('+15551234567'); // Mock coordinator phone number
    }
    
    if (recipientTypes.includes(RecipientType.ADMIN)) {
      phoneNumbers.push('+15559876543'); // Mock admin phone number
    }
    
    return phoneNumbers;
  }
  
  /**
   * Get recipient email addresses based on recipient types
   */
  private async getRecipientEmailAddresses(
    notification: NotificationRequest,
    recipientTypes: RecipientType[]
  ): Promise<string[]> {
    const emailAddresses: string[] = [];
    
    // In a real implementation, we would fetch email addresses from a database
    if (recipientTypes.includes(RecipientType.CUSTOMER)) {
      emailAddresses.push('customer@example.com'); // Mock customer email
    }
    
    if (recipientTypes.includes(RecipientType.COORDINATOR)) {
      emailAddresses.push('coordinator@lastmiledelivery.com'); // Mock coordinator email
    }
    
    if (recipientTypes.includes(RecipientType.ADMIN)) {
      emailAddresses.push('admin@lastmiledelivery.com'); // Mock admin email
    }
    
    return emailAddresses;
  }
  
  /**
   * Get recipient device tokens based on recipient types
   */
  private async getRecipientDeviceTokens(
    notification: NotificationRequest,
    recipientTypes: RecipientType[]
  ): Promise<string[]> {
    const deviceTokens: string[] = [];
    
    // In a real implementation, we would fetch device tokens from a database
    if (recipientTypes.includes(RecipientType.CUSTOMER)) {
      deviceTokens.push('customer-device-token-123'); // Mock customer device token
    }
    
    if (recipientTypes.includes(RecipientType.COORDINATOR)) {
      deviceTokens.push('coordinator-device-token-456'); // Mock coordinator device token
    }
    
    if (recipientTypes.includes(RecipientType.ADMIN)) {
      deviceTokens.push('admin-device-token-789'); // Mock admin device token
    }
    
    return deviceTokens;
  }
  
  /**
   * Generate SMS message based on notification
   */
  private generateSmsMessage(notification: NotificationRequest): string {
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
  
  /**
   * Generate email subject based on notification
   */
  private generateEmailSubject(notification: NotificationRequest): string {
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
  
  /**
   * Generate email body based on notification
   */
  private generateEmailBody(notification: NotificationRequest): string {
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
        } else {
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
  
  /**
   * Generate push notification title based on notification
   */
  private generatePushTitle(notification: NotificationRequest): string {
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
  
  /**
   * Generate push notification body based on notification
   */
  private generatePushBody(notification: NotificationRequest): string {
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
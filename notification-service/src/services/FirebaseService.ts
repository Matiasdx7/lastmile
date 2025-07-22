// Use require instead of import for firebase-admin to avoid TypeScript errors
const admin = require('firebase-admin');
import { NotificationPriority, RecipientType } from './NotificationService';

// Define interfaces for Firebase Admin types
interface MulticastMessage {
  notification: {
    title: string;
    body: string;
  };
  data: Record<string, string>;
  android?: {
    priority: string;
    notification: {
      sound: string;
      priority: string;
    };
  };
  apns?: {
    payload: {
      aps: {
        sound: string;
        badge: number;
      };
    };
  };
  tokens: string[];
}

interface Message {
  notification: {
    title: string;
    body: string;
  };
  data: Record<string, string>;
  android?: any;
  apns?: any;
  topic: string;
}

interface MessagingResponse {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

interface MulticastResponse {
  successCount: number;
  failureCount: number;
  responses: MessagingResponse[];
}

/**
 * Push notification request interface
 */
export interface PushNotificationRequest {
  title: string;
  body: string;
  data: Record<string, string>;
  tokens: string[];
  priority?: NotificationPriority;
  topic?: string;
}

/**
 * Device registration interface
 */
export interface DeviceRegistration {
  userId: string;
  deviceToken: string;
  deviceType: 'ios' | 'android' | 'web';
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service for handling Firebase Cloud Messaging
 */
export class FirebaseService {
  private initialized: boolean = false;
  private deviceTokens: Map<string, DeviceRegistration[]> = new Map();

  /**
   * Initialize Firebase Admin SDK
   */
  constructor() {
    try {
      // Check if Firebase Admin SDK is already initialized
      if (admin.apps.length === 0) {
        // Initialize Firebase Admin SDK with service account
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
          ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
          : undefined;

        if (serviceAccount) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
          });
          this.initialized = true;
        } else {
          // Try to initialize with application default credentials
          admin.initializeApp();
          this.initialized = true;
        }
      } else {
        this.initialized = true;
      }
    } catch (error: unknown) {
      console.error('Error initializing Firebase Admin SDK:', error);
      this.initialized = false;
    }
  }

  /**
   * Register device token
   */
  public registerDevice(registration: DeviceRegistration): boolean {
    try {
      const { userId, deviceToken, deviceType, role } = registration;

      // Get existing devices for user
      const userDevices = this.deviceTokens.get(userId) || [];

      // Check if device token already exists
      const existingDeviceIndex = userDevices.findIndex(device => device.deviceToken === deviceToken);

      if (existingDeviceIndex >= 0) {
        // Update existing device
        userDevices[existingDeviceIndex] = {
          ...registration,
          updatedAt: new Date()
        };
      } else {
        // Add new device
        userDevices.push({
          ...registration,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Update device tokens map
      this.deviceTokens.set(userId, userDevices);

      // Subscribe to role-based topic
      if (this.initialized) {
        admin.messaging().subscribeToTopic([deviceToken], `role-${role}`)
          .then(() => console.log(`Device ${deviceToken} subscribed to topic role-${role}`))
          .catch((error: Error) => console.error('Error subscribing to topic:', error));
      }

      return true;
    } catch (error: unknown) {
      console.error('Error registering device:', error);
      return false;
    }
  }

  /**
   * Unregister device token
   */
  public unregisterDevice(deviceToken: string): boolean {
    try {
      // Find user with this device token
      for (const [userId, devices] of this.deviceTokens.entries()) {
        const deviceIndex = devices.findIndex(device => device.deviceToken === deviceToken);

        if (deviceIndex >= 0) {
          // Remove device from user's devices
          devices.splice(deviceIndex, 1);

          // Update device tokens map
          if (devices.length > 0) {
            this.deviceTokens.set(userId, devices);
          } else {
            this.deviceTokens.delete(userId);
          }

          return true;
        }
      }

      return false;
    } catch (error: unknown) {
      console.error('Error unregistering device:', error);
      return false;
    }
  }

  /**
   * Get device tokens for user
   */
  public getDeviceTokensForUser(userId: string): string[] {
    const userDevices = this.deviceTokens.get(userId) || [];
    return userDevices.map(device => device.deviceToken);
  }

  /**
   * Get device tokens for role
   */
  public getDeviceTokensForRole(role: string): string[] {
    const tokens: string[] = [];

    // Collect all device tokens for users with the specified role
    for (const devices of this.deviceTokens.values()) {
      devices.forEach(device => {
        if (device.role === role) {
          tokens.push(device.deviceToken);
        }
      });
    }

    return tokens;
  }

  /**
   * Get device tokens for recipient types
   */
  public getDeviceTokensForRecipients(
    recipientTypes: RecipientType[],
    specificUserId?: string
  ): string[] {
    const tokens: Set<string> = new Set();

    // Add tokens for specific user if provided
    if (specificUserId) {
      const userTokens = this.getDeviceTokensForUser(specificUserId);
      userTokens.forEach(token => tokens.add(token));
    }

    // Add tokens for each recipient type
    recipientTypes.forEach(recipientType => {
      let roleTokens: string[] = [];

      switch (recipientType) {
        case RecipientType.DRIVER:
          roleTokens = this.getDeviceTokensForRole('driver');
          break;
        case RecipientType.COORDINATOR:
          roleTokens = this.getDeviceTokensForRole('coordinator');
          break;
        case RecipientType.ADMIN:
          roleTokens = this.getDeviceTokensForRole('admin');
          break;
        // Customer tokens would typically be fetched from a database
        case RecipientType.CUSTOMER:
          // In a real implementation, we would fetch customer tokens from a database
          break;
      }

      roleTokens.forEach(token => tokens.add(token));
    });

    return Array.from(tokens);
  }

  /**
   * Send push notification to specific devices
   */
  public async sendPushNotification(request: PushNotificationRequest): Promise<boolean> {
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

      // Skip if no tokens provided
      if (!request.tokens || request.tokens.length === 0) {
        if (!request.topic) {
          console.warn('No device tokens or topic provided for push notification');
          return false;
        }
      }

      // Determine notification priority
      const priority = request.priority === NotificationPriority.HIGH ||
        request.priority === NotificationPriority.CRITICAL
        ? 'high'
        : 'normal';

      // Create message
      const message: MulticastMessage = {
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

      // Send message
      if (request.tokens && request.tokens.length > 0) {
        const response = await admin.messaging().sendMulticast(message) as MulticastResponse;
        console.log(`Successfully sent message to ${response.successCount} devices`);

        // Log failures
        if (response.failureCount > 0) {
          const failedTokens: string[] = [];
          response.responses.forEach((resp: MessagingResponse, idx: number) => {
            if (!resp.success) {
              failedTokens.push(request.tokens[idx]);
              console.error('Error sending message to device:', resp.error);
            }
          });

          console.error(`Failed to send message to ${failedTokens.length} devices:`, failedTokens);
        }

        return response.successCount > 0;
      } else if (request.topic) {
        // Send to topic instead
        const topicMessage: Message = {
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
    } catch (error: unknown) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Send push notification to topic
   */
  public async sendTopicNotification(
    topic: string,
    title: string,
    body: string,
    data: Record<string, string> = {},
    priority: NotificationPriority = NotificationPriority.MEDIUM
  ): Promise<boolean> {
    return this.sendPushNotification({
      title,
      body,
      data,
      tokens: [],
      priority,
      topic
    });
  }

  /**
   * Send push notification to role
   */
  public async sendRoleNotification(
    role: string,
    title: string,
    body: string,
    data: Record<string, string> = {},
    priority: NotificationPriority = NotificationPriority.MEDIUM
  ): Promise<boolean> {
    return this.sendTopicNotification(`role-${role}`, title, body, data, priority);
  }
}
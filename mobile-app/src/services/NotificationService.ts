import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Base URL for API calls
const API_BASE_URL = 'http://localhost:3005/api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Notification types
 */
export enum NotificationType {
  DELIVERY_UPDATE = 'delivery_update',
  ROUTE_UPDATE = 'route_update',
  ASSIGNMENT = 'assignment',
  SYSTEM = 'system'
}

/**
 * Notification service for handling push notifications
 */
export class NotificationService {
  /**
   * Register for push notifications
   */
  static async registerForPushNotifications(): Promise<string | null> {
    try {
      // Check if device is physical (not simulator/emulator)
      if (!Device.isDevice) {
        console.log('Push notifications are not available on simulator/emulator');
        return null;
      }

      // Check permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      // Return null if permission not granted
      if (finalStatus !== 'granted') {
        console.log('Permission for push notifications was denied');
        return null;
      }

      // Get push token
      const expoPushToken = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      // Store token locally
      await SecureStore.setItemAsync('pushToken', expoPushToken.data);
      
      // Configure for Android
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
      
      return expoPushToken.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Register device token with server
   */
  static async registerDeviceWithServer(
    userId: string, 
    deviceToken: string,
    deviceType: 'ios' | 'android' | 'web' = Platform.OS as 'ios' | 'android'
  ): Promise<boolean> {
    try {
      await axios.post(`${API_BASE_URL}/notifications/devices`, {
        userId,
        deviceToken,
        deviceType,
        role: await SecureStore.getItemAsync('userRole') || 'driver'
      });
      
      return true;
    } catch (error) {
      console.error('Error registering device with server:', error);
      return false;
    }
  }

  /**
   * Unregister device token from server
   */
  static async unregisterDeviceFromServer(): Promise<boolean> {
    try {
      const deviceToken = await SecureStore.getItemAsync('pushToken');
      
      if (!deviceToken) {
        return false;
      }
      
      await axios.delete(`${API_BASE_URL}/notifications/devices`, {
        data: { deviceToken }
      });
      
      // Clear token from local storage
      await SecureStore.deleteItemAsync('pushToken');
      
      return true;
    } catch (error) {
      console.error('Error unregistering device from server:', error);
      return false;
    }
  }

  /**
   * Send local notification
   */
  static async sendLocalNotification(
    title: string,
    body: string,
    data: any = {}
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Show immediately
    });
  }

  /**
   * Handle received notification
   */
  static handleNotificationReceived(notification: Notifications.Notification): void {
    const { data } = notification.request.content;
    
    // Log notification data
    console.log('Notification received:', data);
    
    // Handle different notification types
    switch (data.type) {
      case NotificationType.DELIVERY_UPDATE:
        // Handle delivery update notification
        break;
      case NotificationType.ROUTE_UPDATE:
        // Handle route update notification
        break;
      case NotificationType.ASSIGNMENT:
        // Handle assignment notification
        break;
      default:
        // Handle other notification types
        break;
    }
  }

  /**
   * Handle notification response (when user taps notification)
   */
  static handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { data } = response.notification.request.content;
    
    // Log notification response
    console.log('Notification tapped:', data);
    
    // Handle different notification types
    switch (data.type) {
      case NotificationType.DELIVERY_UPDATE:
        // Navigate to delivery details screen
        if (data.orderId) {
          // Navigation would be handled here
          // Example: navigation.navigate('DeliveryDetails', { orderId: data.orderId });
        }
        break;
      case NotificationType.ROUTE_UPDATE:
        // Navigate to route screen
        // Example: navigation.navigate('RouteScreen');
        break;
      case NotificationType.ASSIGNMENT:
        // Navigate to assignments screen
        // Example: navigation.navigate('Assignments');
        break;
      default:
        // Handle other notification types
        break;
    }
  }

  /**
   * Set up notification listeners
   * Call this in your App.tsx or in a context provider
   */
  static setUpNotificationListeners(): { removeListeners: () => void } {
    // Handle received notifications
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      this.handleNotificationReceived
    );
    
    // Handle notification responses (when user taps)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      this.handleNotificationResponse
    );
    
    // Return function to remove listeners
    return {
      removeListeners: () => {
        receivedSubscription.remove();
        responseSubscription.remove();
      }
    };
  }
}

export default NotificationService;
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuth } from './AuthContext';
import NotificationService from '../services/NotificationService';

// Define context type
interface NotificationContextType {
  hasPermission: boolean;
  pushToken: string | null;
  notificationCount: number;
  lastNotification: any | null;
  requestPermissions: () => Promise<boolean>;
  sendLocalNotification: (title: string, body: string, data?: any) => Promise<void>;
  clearNotificationCount: () => void;
}

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Create provider component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [lastNotification, setLastNotification] = useState<any | null>(null);

  // Request notification permissions
  const requestPermissions = async (): Promise<boolean> => {
    try {
      const token = await NotificationService.registerForPushNotifications();
      setPushToken(token);
      setHasPermission(!!token);
      return !!token;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  };

  // Send a local notification
  const sendLocalNotification = async (title: string, body: string, data: any = {}): Promise<void> => {
    await NotificationService.sendLocalNotification(title, body, data);
  };

  // Clear notification count
  const clearNotificationCount = (): void => {
    setNotificationCount(0);
  };

  // Set up notification listeners
  useEffect(() => {
    // Set up notification handlers
    const { removeListeners } = NotificationService.setUpNotificationListeners();

    // Add custom notification received listener to update count and last notification
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      setNotificationCount((prev) => prev + 1);
      setLastNotification(notification.request.content);
    });

    // Request permissions on mount
    requestPermissions();

    // Clean up listeners
    return () => {
      removeListeners();
      receivedSubscription.remove();
    };
  }, []);

  // Register device with server when authenticated
  useEffect(() => {
    const registerDevice = async () => {
      if (isAuthenticated && user && pushToken) {
        await NotificationService.registerDeviceWithServer(user.id, pushToken);
      }
    };

    registerDevice();
  }, [isAuthenticated, user, pushToken]);

  // Context value
  const value = {
    hasPermission,
    pushToken,
    notificationCount,
    lastNotification,
    requestPermissions,
    sendLocalNotification,
    clearNotificationCount
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

// Create custom hook for using notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
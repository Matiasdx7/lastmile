declare module 'expo-notifications' {
  export interface NotificationRequest {
    content: {
      title: string;
      body: string;
      data: any;
      sound?: boolean;
    };
    trigger: any;
  }

  export interface Notification {
    request: {
      content: {
        title: string;
        body: string;
        data: any;
      };
    };
  }

  export interface NotificationResponse {
    notification: Notification;
  }

  export enum AndroidImportance {
    MAX = 5,
    HIGH = 4,
    DEFAULT = 3,
    LOW = 2,
    MIN = 1,
    NONE = 0
  }

  export function setNotificationHandler(handler: {
    handleNotification: () => Promise<{
      shouldShowAlert: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
    }>;
  }): void;

  export function getPermissionsAsync(): Promise<{ status: string }>;
  export function requestPermissionsAsync(): Promise<{ status: string }>;
  export function getExpoPushTokenAsync(options?: { projectId?: string }): Promise<{ data: string }>;
  export function setNotificationChannelAsync(
    channelId: string,
    channelConfig: {
      name: string;
      importance: AndroidImportance;
      vibrationPattern?: number[];
      lightColor?: string;
    }
  ): Promise<void>;
  export function scheduleNotificationAsync(request: NotificationRequest): Promise<string>;
  export function addNotificationReceivedListener(
    listener: (notification: Notification) => void
  ): { remove: () => void };
  export function addNotificationResponseReceivedListener(
    listener: (response: NotificationResponse) => void
  ): { remove: () => void };
}
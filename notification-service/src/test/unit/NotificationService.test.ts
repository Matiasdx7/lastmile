import { NotificationService, NotificationRequest, NotificationType, RecipientType, NotificationPriority } from '../../services/NotificationService';
import { TwilioService } from '../../services/TwilioService';
import { FirebaseService } from '../../services/FirebaseService';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock TwilioService
jest.mock('../../services/TwilioService', () => {
  return {
    TwilioService: jest.fn().mockImplementation(() => {
      return {
        sendSms: jest.fn().mockResolvedValue(true),
        sendSmsWithTemplate: jest.fn().mockResolvedValue(true),
        bulkSendSms: jest.fn().mockResolvedValue({ success: 2, failed: 0 }),
        bulkSendSmsWithTemplate: jest.fn().mockResolvedValue({ success: 2, failed: 0 }),
        getTemplate: jest.fn().mockReturnValue({ name: 'test', content: 'Test template' }),
        setTemplate: jest.fn()
      };
    })
  };
});

// Mock FirebaseService
jest.mock('../../services/FirebaseService', () => {
  return {
    FirebaseService: jest.fn().mockImplementation(() => {
      return {
        registerDevice: jest.fn().mockReturnValue(true),
        unregisterDevice: jest.fn().mockReturnValue(true),
        getDeviceTokensForUser: jest.fn().mockReturnValue(['device-token-1']),
        getDeviceTokensForRole: jest.fn().mockReturnValue(['device-token-2']),
        getDeviceTokensForRecipients: jest.fn().mockReturnValue(['device-token-1', 'device-token-2']),
        sendPushNotification: jest.fn().mockResolvedValue(true),
        sendTopicNotification: jest.fn().mockResolvedValue(true),
        sendRoleNotification: jest.fn().mockResolvedValue(true)
      };
    })
  };
});

describe('NotificationService', () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    // Create service instance
    notificationService = new NotificationService();

    // Mock environment variables
    process.env.SMS_API_KEY = 'test-sms-api-key';
    process.env.EMAIL_API_KEY = 'test-email-api-key';
    process.env.PUSH_API_KEY = 'test-push-api-key';

    // Mock console methods to prevent test output noise
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processNotification', () => {
    it('should process a notification request with default settings', async () => {
      // Arrange
      const notificationRequest: NotificationRequest = {
        orderId: 'order123',
        dispatchId: 'dispatch123',
        status: 'delivered',
        customerName: 'John Doe',
        customerPhone: '1234567890',
        deliveryAddress: {
          street: '123 Main St',
          city: 'City',
          state: 'State',
          zipCode: '12345'
        },
        timestamp: new Date().toISOString(),
        details: {
          signature: 'base64signature',
          photo: 'base64photo',
          notes: 'Delivered to front door'
        }
      };

      // Mock the notification methods
      jest.spyOn(notificationService as any, 'sendSmsNotifications').mockResolvedValue(true);
      jest.spyOn(notificationService as any, 'sendEmailNotifications').mockResolvedValue(true);
      jest.spyOn(notificationService as any, 'sendPushNotifications').mockResolvedValue(true);

      // Act
      const result = await notificationService.processNotification(notificationRequest);

      // Assert
      expect(result).toBe(true);
      expect((notificationService as any).sendSmsNotifications).toHaveBeenCalledWith(
        notificationRequest,
        [RecipientType.CUSTOMER, RecipientType.COORDINATOR],
        NotificationPriority.MEDIUM
      );
      expect((notificationService as any).sendEmailNotifications).toHaveBeenCalledWith(
        notificationRequest,
        [RecipientType.CUSTOMER, RecipientType.COORDINATOR],
        NotificationPriority.MEDIUM
      );
      expect((notificationService as any).sendPushNotifications).toHaveBeenCalledWith(
        notificationRequest,
        [RecipientType.CUSTOMER, RecipientType.COORDINATOR],
        NotificationPriority.MEDIUM
      );
    });

    it('should process a notification request with custom settings', async () => {
      // Arrange
      const notificationRequest: NotificationRequest = {
        orderId: 'order123',
        dispatchId: 'dispatch123',
        status: 'failed',
        customerName: 'John Doe',
        customerPhone: '1234567890',
        deliveryAddress: {
          street: '123 Main St',
          city: 'City',
          state: 'State',
          zipCode: '12345'
        },
        timestamp: new Date().toISOString(),
        details: {
          reason: 'customer_not_available',
          notes: 'No one answered the door'
        },
        recipientTypes: [RecipientType.COORDINATOR, RecipientType.ADMIN],
        notificationTypes: [NotificationType.EMAIL, NotificationType.PUSH],
        priority: NotificationPriority.HIGH
      };

      // Mock the notification methods
      jest.spyOn(notificationService as any, 'sendEmailNotifications').mockResolvedValue(true);
      jest.spyOn(notificationService as any, 'sendPushNotifications').mockResolvedValue(true);

      // Act
      const result = await notificationService.processNotification(notificationRequest);

      // Assert
      expect(result).toBe(true);
      expect((notificationService as any).sendSmsNotifications).not.toHaveBeenCalled();
      expect((notificationService as any).sendEmailNotifications).toHaveBeenCalledWith(
        notificationRequest,
        [RecipientType.COORDINATOR, RecipientType.ADMIN],
        NotificationPriority.HIGH
      );
      expect((notificationService as any).sendPushNotifications).toHaveBeenCalledWith(
        notificationRequest,
        [RecipientType.COORDINATOR, RecipientType.ADMIN],
        NotificationPriority.HIGH
      );
    });

    it('should return true if at least one notification method succeeds', async () => {
      // Arrange
      const notificationRequest: NotificationRequest = {
        orderId: 'order123',
        dispatchId: 'dispatch123',
        status: 'delivered',
        customerName: 'John Doe',
        customerPhone: '1234567890',
        deliveryAddress: {
          street: '123 Main St',
          city: 'City',
          state: 'State',
          zipCode: '12345'
        },
        timestamp: new Date().toISOString(),
        details: {
          signature: 'base64signature',
          photo: 'base64photo',
          notes: 'Delivered to front door'
        }
      };

      // Mock the notification methods with some failures
      jest.spyOn(notificationService as any, 'sendSmsNotifications').mockResolvedValue(false);
      jest.spyOn(notificationService as any, 'sendEmailNotifications').mockResolvedValue(true);
      jest.spyOn(notificationService as any, 'sendPushNotifications').mockRejectedValue(new Error('Failed to send push notification'));

      // Act
      const result = await notificationService.processNotification(notificationRequest);

      // Assert
      expect(result).toBe(true); // Email notification succeeded
    });

    it('should return false if all notification methods fail', async () => {
      // Arrange
      const notificationRequest: NotificationRequest = {
        orderId: 'order123',
        dispatchId: 'dispatch123',
        status: 'delivered',
        customerName: 'John Doe',
        customerPhone: '1234567890',
        deliveryAddress: {
          street: '123 Main St',
          city: 'City',
          state: 'State',
          zipCode: '12345'
        },
        timestamp: new Date().toISOString(),
        details: {
          signature: 'base64signature',
          photo: 'base64photo',
          notes: 'Delivered to front door'
        }
      };

      // Mock the notification methods with all failures
      jest.spyOn(notificationService as any, 'sendSmsNotifications').mockResolvedValue(false);
      jest.spyOn(notificationService as any, 'sendEmailNotifications').mockResolvedValue(false);
      jest.spyOn(notificationService as any, 'sendPushNotifications').mockResolvedValue(false);

      // Act
      const result = await notificationService.processNotification(notificationRequest);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('sendSmsNotifications', () => {
    it('should send SMS notifications to recipients using Twilio templates', async () => {
      // Arrange
      const notificationRequest: NotificationRequest = {
        orderId: 'order123',
        status: 'delivered',
        customerName: 'John Doe',
        customerPhone: '1234567890',
        deliveryAddress: {
          street: '123 Main St',
          city: 'City',
          state: 'State',
          zipCode: '12345'
        },
        timestamp: new Date().toISOString(),
        details: {
          signature: 'base64signature',
          photo: 'base64photo',
          notes: 'Delivered to front door'
        }
      };

      // Mock getRecipientPhoneNumbers to return phone numbers
      jest.spyOn(notificationService as any, 'getRecipientPhoneNumbers').mockResolvedValue(['1234567890', '5551234567']);

      // Act
      const result = await (notificationService as any).sendSmsNotifications(
        notificationRequest,
        [RecipientType.CUSTOMER, RecipientType.COORDINATOR],
        NotificationPriority.MEDIUM
      );

      // Assert
      expect(result).toBe(true);
      expect((notificationService as any).getRecipientPhoneNumbers).toHaveBeenCalledWith(
        notificationRequest,
        [RecipientType.CUSTOMER, RecipientType.COORDINATOR]
      );

      // Check that Twilio service was used
      const twilioService = (notificationService as any).twilioService;
      expect(twilioService.sendSmsWithTemplate).toHaveBeenCalled();
    });

    it('should send high priority SMS notifications immediately', async () => {
      // Arrange
      const notificationRequest: NotificationRequest = {
        orderId: 'order123',
        status: 'failed',
        customerName: 'John Doe',
        customerPhone: '1234567890',
        deliveryAddress: {
          street: '123 Main St',
          city: 'City',
          state: 'State',
          zipCode: '12345'
        },
        timestamp: new Date().toISOString(),
        details: {
          reason: 'customer_not_available',
          nextAction: 'retry_later'
        }
      };

      // Mock getRecipientPhoneNumbers to return phone numbers
      jest.spyOn(notificationService as any, 'getRecipientPhoneNumbers').mockResolvedValue(['1234567890', '5551234567']);

      // Act
      const result = await (notificationService as any).sendSmsNotifications(
        notificationRequest,
        [RecipientType.CUSTOMER, RecipientType.COORDINATOR],
        NotificationPriority.HIGH
      );

      // Assert
      expect(result).toBe(true);

      // Check that Twilio bulk service was used for high priority
      const twilioService = (notificationService as any).twilioService;
      expect(twilioService.bulkSendSmsWithTemplate).toHaveBeenCalled();
    });

    it('should return false when no phone numbers are found', async () => {
      // Arrange
      const notificationRequest: NotificationRequest = {
        orderId: 'order123',
        status: 'delivered',
        customerName: 'John Doe',
        customerPhone: '1234567890',
        deliveryAddress: {
          street: '123 Main St',
          city: 'City',
          state: 'State',
          zipCode: '12345'
        },
        timestamp: new Date().toISOString(),
        details: {}
      };

      // Mock getRecipientPhoneNumbers to return empty array
      jest.spyOn(notificationService as any, 'getRecipientPhoneNumbers').mockResolvedValue([]);

      // Act
      const result = await (notificationService as any).sendSmsNotifications(
        notificationRequest,
        [RecipientType.CUSTOMER],
        NotificationPriority.MEDIUM
      );

      // Assert
      expect(result).toBe(false);
    });

    it('should use custom SMS for unknown status types', async () => {
      // Arrange
      const notificationRequest: NotificationRequest = {
        orderId: 'order123',
        status: 'in_transit' as any,
        customerName: 'John Doe',
        customerPhone: '1234567890',
        deliveryAddress: {
          street: '123 Main St',
          city: 'City',
          state: 'State',
          zipCode: '12345'
        },
        timestamp: new Date().toISOString(),
        details: {}
      };

      // Mock getRecipientPhoneNumbers to return phone numbers
      jest.spyOn(notificationService as any, 'getRecipientPhoneNumbers').mockResolvedValue(['1234567890']);

      // Mock generateSmsMessage
      jest.spyOn(notificationService as any, 'generateSmsMessage').mockReturnValue('Your order is in transit');

      // Mock sendCustomSmsNotifications
      jest.spyOn(notificationService as any, 'sendCustomSmsNotifications').mockResolvedValue(true);

      // Act
      const result = await (notificationService as any).sendSmsNotifications(
        notificationRequest,
        [RecipientType.CUSTOMER],
        NotificationPriority.MEDIUM
      );

      // Assert
      expect(result).toBe(true);
      expect((notificationService as any).sendCustomSmsNotifications).toHaveBeenCalled();
    });
  });

  describe('generateSmsMessage', () => {
    it('should generate correct message for delivered status', () => {
      // Arrange
      const notification: NotificationRequest = {
        orderId: 'order123',
        status: 'delivered',
        customerName: 'John Doe',
        customerPhone: '1234567890',
        deliveryAddress: {
          street: '123 Main St',
          city: 'City',
          state: 'State',
          zipCode: '12345'
        },
        timestamp: new Date().toISOString(),
        details: {}
      };

      // Act
      const message = (notificationService as any).generateSmsMessage(notification);

      // Assert
      expect(message).toContain('order #order123 has been delivered successfully');
    });

    it('should generate correct message for failed status', () => {
      // Arrange
      const notification: NotificationRequest = {
        orderId: 'order123',
        status: 'failed',
        customerName: 'John Doe',
        customerPhone: '1234567890',
        deliveryAddress: {
          street: '123 Main St',
          city: 'City',
          state: 'State',
          zipCode: '12345'
        },
        timestamp: new Date().toISOString(),
        details: {
          reason: 'customer_not_available',
          nextAction: 'retry_later'
        }
      };

      // Act
      const message = (notificationService as any).generateSmsMessage(notification);

      // Assert
      expect(message).toContain('unsuccessful due to customer_not_available');
      expect(message).toContain('We will attempt delivery again soon');
    });

    it('should generate correct message for delayed status', () => {
      // Arrange
      const notification: NotificationRequest = {
        orderId: 'order123',
        status: 'delayed',
        customerName: 'John Doe',
        customerPhone: '1234567890',
        deliveryAddress: {
          street: '123 Main St',
          city: 'City',
          state: 'State',
          zipCode: '12345'
        },
        timestamp: new Date().toISOString(),
        details: {
          estimatedDelay: 15
        }
      };

      // Act
      const message = (notificationService as any).generateSmsMessage(notification);

      // Assert
      expect(message).toContain('delayed by approximately 15 minutes');
    });
  });

  describe('getRecipientPhoneNumbers', () => {
    it('should include customer phone number when customer is a recipient', async () => {
      // Arrange
      const notification: NotificationRequest = {
        orderId: 'order123',
        status: 'delivered',
        customerName: 'John Doe',
        customerPhone: '1234567890',
        deliveryAddress: {
          street: '123 Main St',
          city: 'City',
          state: 'State',
          zipCode: '12345'
        },
        timestamp: new Date().toISOString(),
        details: {}
      };

      // Act
      const phoneNumbers = await (notificationService as any).getRecipientPhoneNumbers(
        notification,
        [RecipientType.CUSTOMER]
      );

      // Assert
      expect(phoneNumbers).toContain('1234567890');
    });

    it('should include coordinator phone number when coordinator is a recipient', async () => {
      // Arrange
      const notification: NotificationRequest = {
        orderId: 'order123',
        status: 'delivered',
        customerName: 'John Doe',
        customerPhone: '1234567890',
        deliveryAddress: {
          street: '123 Main St',
          city: 'City',
          state: 'State',
          zipCode: '12345'
        },
        timestamp: new Date().toISOString(),
        details: {}
      };

      // Act
      const phoneNumbers = await (notificationService as any).getRecipientPhoneNumbers(
        notification,
        [RecipientType.COORDINATOR]
      );

      // Assert
      expect(phoneNumbers.length).toBe(1);
      expect(phoneNumbers[0]).toMatch(/^\+1\d{10}$/); // Should be a phone number format
    });
  });
});

describe('sendPushNotifications', () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    // Create service instance
    notificationService = new NotificationService();

    // Mock environment variables
    process.env.SMS_API_KEY = 'test-sms-api-key';
    process.env.EMAIL_API_KEY = 'test-email-api-key';
    process.env.PUSH_API_KEY = 'test-push-api-key';

    // Mock console methods to prevent test output noise
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send push notifications to recipients using Firebase', async () => {
    // Arrange
    const notificationRequest: NotificationRequest = {
      orderId: 'order123',
      status: 'delivered',
      customerName: 'John Doe',
      customerPhone: '1234567890',
      deliveryAddress: {
        street: '123 Main St',
        city: 'City',
        state: 'State',
        zipCode: '12345'
      },
      timestamp: new Date().toISOString(),
      details: {
        signature: 'base64signature',
        photo: 'base64photo',
        notes: 'Delivered to front door'
      }
    };

    // Mock getRecipientDeviceTokens to return device tokens
    jest.spyOn(notificationService as any, 'getRecipientDeviceTokens').mockResolvedValue(['token1', 'token2']);

    // Mock generatePushTitle and generatePushBody
    jest.spyOn(notificationService as any, 'generatePushTitle').mockReturnValue('Order Delivered');
    jest.spyOn(notificationService as any, 'generatePushBody').mockReturnValue('Your order has been delivered');

    // Act
    const result = await (notificationService as any).sendPushNotifications(
      notificationRequest,
      [RecipientType.CUSTOMER, RecipientType.COORDINATOR],
      NotificationPriority.MEDIUM
    );

    // Assert
    expect(result).toBe(true);
    expect((notificationService as any).getRecipientDeviceTokens).toHaveBeenCalledWith(
      notificationRequest,
      [RecipientType.CUSTOMER, RecipientType.COORDINATOR]
    );

    // Check that Firebase service was used
    const firebaseService = (notificationService as any).firebaseService;
    expect(firebaseService.sendPushNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Order Delivered',
        body: 'Your order has been delivered',
        tokens: ['token1', 'token2'],
        data: expect.objectContaining({
          orderId: 'order123',
          status: 'delivered',
          type: 'delivery_completed'
        })
      })
    );
  });

  it('should return false when no device tokens are found', async () => {
    // Arrange
    const notificationRequest: NotificationRequest = {
      orderId: 'order123',
      status: 'delivered',
      customerName: 'John Doe',
      customerPhone: '1234567890',
      deliveryAddress: {
        street: '123 Main St',
        city: 'City',
        state: 'State',
        zipCode: '12345'
      },
      timestamp: new Date().toISOString(),
      details: {}
    };

    // Mock getRecipientDeviceTokens to return empty array
    jest.spyOn(notificationService as any, 'getRecipientDeviceTokens').mockResolvedValue([]);

    // Act
    const result = await (notificationService as any).sendPushNotifications(
      notificationRequest,
      [RecipientType.CUSTOMER],
      NotificationPriority.MEDIUM
    );

    // Assert
    expect(result).toBe(false);
  });

  it('should handle Firebase errors gracefully', async () => {
    // Arrange
    const notificationRequest: NotificationRequest = {
      orderId: 'order123',
      status: 'delivered',
      customerName: 'John Doe',
      customerPhone: '1234567890',
      deliveryAddress: {
        street: '123 Main St',
        city: 'City',
        state: 'State',
        zipCode: '12345'
      },
      timestamp: new Date().toISOString(),
      details: {}
    };

    // Mock getRecipientDeviceTokens to return device tokens
    jest.spyOn(notificationService as any, 'getRecipientDeviceTokens').mockResolvedValue(['token1', 'token2']);

    // Mock Firebase service to throw error
    const firebaseService = (notificationService as any).firebaseService;
    firebaseService.sendPushNotification.mockRejectedValueOnce(new Error('Firebase error'));

    // Act
    const result = await (notificationService as any).sendPushNotifications(
      notificationRequest,
      [RecipientType.CUSTOMER],
      NotificationPriority.MEDIUM
    );

    // Assert
    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalledWith('Error sending push notifications:', expect.any(Error));
  });
});

describe('getPushNotificationType', () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    // Create service instance
    notificationService = new NotificationService();

    // Mock environment variables
    process.env.SMS_API_KEY = 'test-sms-api-key';
    process.env.EMAIL_API_KEY = 'test-email-api-key';
    process.env.PUSH_API_KEY = 'test-push-api-key';

    // Mock console methods to prevent test output noise
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return correct type for delivered status', () => {
    // Arrange
    const notification: NotificationRequest = {
      orderId: 'order123',
      status: 'delivered',
      customerName: 'John Doe',
      customerPhone: '1234567890',
      deliveryAddress: {},
      timestamp: new Date().toISOString(),
      details: {}
    };

    // Act
    const type = (notificationService as any).getPushNotificationType(notification);

    // Assert
    expect(type).toBe('delivery_completed');
  });

  it('should return correct type for failed status', () => {
    // Arrange
    const notification: NotificationRequest = {
      orderId: 'order123',
      status: 'failed',
      customerName: 'John Doe',
      customerPhone: '1234567890',
      deliveryAddress: {},
      timestamp: new Date().toISOString(),
      details: {}
    };

    // Act
    const type = (notificationService as any).getPushNotificationType(notification);

    // Assert
    expect(type).toBe('delivery_failed');
  });

  it('should return correct type for delayed status', () => {
    // Arrange
    const notification: NotificationRequest = {
      orderId: 'order123',
      status: 'delayed',
      customerName: 'John Doe',
      customerPhone: '1234567890',
      deliveryAddress: {},
      timestamp: new Date().toISOString(),
      details: {}
    };

    // Act
    const type = (notificationService as any).getPushNotificationType(notification);

    // Assert
    expect(type).toBe('delivery_delayed');
  });

  it('should return correct type for in_transit status', () => {
    // Arrange
    const notification: NotificationRequest = {
      orderId: 'order123',
      status: 'in_transit',
      customerName: 'John Doe',
      customerPhone: '1234567890',
      deliveryAddress: {},
      timestamp: new Date().toISOString(),
      details: {}
    };

    // Act
    const type = (notificationService as any).getPushNotificationType(notification);

    // Assert
    expect(type).toBe('delivery_in_transit');
  });

  it('should return default type for unknown status', () => {
    // Arrange
    const notification: NotificationRequest = {
      orderId: 'order123',
      status: 'unknown' as any,
      customerName: 'John Doe',
      customerPhone: '1234567890',
      deliveryAddress: {},
      timestamp: new Date().toISOString(),
      details: {}
    };

    // Act
    const type = (notificationService as any).getPushNotificationType(notification);

    // Assert
    expect(type).toBe('delivery_update');
  });
});
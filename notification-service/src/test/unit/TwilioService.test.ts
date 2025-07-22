import { TwilioService, SmsTemplate, SmsRequest } from '../../services/TwilioService';

// Mock Twilio
jest.mock('twilio', () => {
  return {
    Twilio: jest.fn().mockImplementation(() => {
      return {
        messages: {
          create: jest.fn().mockResolvedValue({
            sid: 'mock-message-sid',
            status: 'queued',
            dateCreated: new Date()
          })
        }
      };
    })
  };
});

describe('TwilioService', () => {
  let twilioService: TwilioService;

  beforeEach(() => {
    // Mock environment variables
    process.env.TWILIO_ACCOUNT_SID = 'test-account-sid';
    process.env.TWILIO_AUTH_TOKEN = 'test-auth-token';
    process.env.TWILIO_PHONE_NUMBER = '+15551234567';
    
    // Create service instance
    twilioService = new TwilioService();
    
    // Mock console methods to prevent test output noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;
    delete process.env.ENABLE_SMS_QUEUE;
  });

  describe('templates', () => {
    it('should initialize with default templates', () => {
      // Act
      const deliverySuccessTemplate = twilioService.getTemplate('delivery_success');
      const deliveryFailedTemplate = twilioService.getTemplate('delivery_failed');
      const deliveryDelayedTemplate = twilioService.getTemplate('delivery_delayed');
      
      // Assert
      expect(deliverySuccessTemplate).toBeDefined();
      expect(deliverySuccessTemplate?.content).toContain('has been delivered successfully');
      
      expect(deliveryFailedTemplate).toBeDefined();
      expect(deliveryFailedTemplate?.content).toContain('was unsuccessful due to');
      
      expect(deliveryDelayedTemplate).toBeDefined();
      expect(deliveryDelayedTemplate?.content).toContain('is delayed by approximately');
    });

    it('should allow adding new templates', () => {
      // Arrange
      const templateName = 'custom_template';
      const templateContent = 'This is a custom template for {{purpose}}';
      
      // Act
      twilioService.setTemplate(templateName, templateContent);
      const template = twilioService.getTemplate(templateName);
      
      // Assert
      expect(template).toBeDefined();
      expect(template?.name).toBe(templateName);
      expect(template?.content).toBe(templateContent);
    });

    it('should allow updating existing templates', () => {
      // Arrange
      const templateName = 'delivery_success';
      const newContent = 'Your package #{{orderId}} has been delivered. Thank you!';
      
      // Act
      twilioService.setTemplate(templateName, newContent);
      const template = twilioService.getTemplate(templateName);
      
      // Assert
      expect(template).toBeDefined();
      expect(template?.content).toBe(newContent);
    });
  });

  describe('sendSms', () => {
    it('should send SMS using Twilio client', async () => {
      // Arrange
      const to = '+15551234567';
      const body = 'Test message';
      
      // Act
      const result = await twilioService.sendSms(to, body);
      
      // Assert
      expect(result).toBe(true);
      const twilioClient = (twilioService as any).client;
      expect(twilioClient.messages.create).toHaveBeenCalledWith({
        body,
        from: '+15551234567', // From the mock environment variable
        to
      });
    });

    it('should handle errors when sending SMS', async () => {
      // Arrange
      const to = '+15551234567';
      const body = 'Test message';
      
      // Mock Twilio client to throw an error
      const twilioClient = (twilioService as any).client;
      twilioClient.messages.create.mockRejectedValueOnce(new Error('Twilio error'));
      
      // Act
      const result = await twilioService.sendSms(to, body);
      
      // Assert
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error sending SMS:', expect.any(Error));
    });

    it('should mock SMS sending when Twilio client is not initialized', async () => {
      // Arrange
      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_AUTH_TOKEN;
      const localTwilioService = new TwilioService();
      const to = '+15551234567';
      const body = 'Test message';
      
      // Act
      const result = await localTwilioService.sendSms(to, body);
      
      // Assert
      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[MOCK] Sending SMS'));
    });
  });

  describe('sendSmsWithTemplate', () => {
    it('should send SMS using template', async () => {
      // Arrange
      const request: SmsRequest = {
        to: '+15551234567',
        templateName: 'delivery_success',
        variables: {
          orderId: '12345'
        }
      };
      
      // Spy on sendSms method
      jest.spyOn(twilioService, 'sendSms').mockResolvedValueOnce(true);
      
      // Act
      const result = await twilioService.sendSmsWithTemplate(request);
      
      // Assert
      expect(result).toBe(true);
      expect(twilioService.sendSms).toHaveBeenCalledWith(
        request.to,
        expect.stringContaining('order #12345 has been delivered successfully')
      );
    });

    it('should return false when template is not found', async () => {
      // Arrange
      const request: SmsRequest = {
        to: '+15551234567',
        templateName: 'non_existent_template',
        variables: {
          orderId: '12345'
        }
      };
      
      // Act
      const result = await twilioService.sendSmsWithTemplate(request);
      
      // Assert
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Template not found')
      );
    });

    it('should replace all variables in the template', async () => {
      // Arrange
      twilioService.setTemplate('test_variables', 'Hello {{name}}, your order #{{orderId}} will arrive in {{time}} minutes.');
      
      const request: SmsRequest = {
        to: '+15551234567',
        templateName: 'test_variables',
        variables: {
          name: 'John',
          orderId: '12345',
          time: 30
        }
      };
      
      // Spy on sendSms method
      jest.spyOn(twilioService, 'sendSms').mockResolvedValueOnce(true);
      
      // Act
      const result = await twilioService.sendSmsWithTemplate(request);
      
      // Assert
      expect(result).toBe(true);
      expect(twilioService.sendSms).toHaveBeenCalledWith(
        request.to,
        'Hello John, your order #12345 will arrive in 30 minutes.'
      );
    });
  });

  describe('queueSms', () => {
    it('should queue SMS when queue is enabled', async () => {
      // Arrange
      process.env.ENABLE_SMS_QUEUE = 'true';
      const localTwilioService = new TwilioService();
      const request: SmsRequest = {
        to: '+15551234567',
        templateName: 'delivery_success',
        variables: {
          orderId: '12345'
        }
      };
      
      // Spy on sendSms method
      jest.spyOn(localTwilioService, 'sendSms').mockResolvedValueOnce(true);
      
      // Mock setTimeout to execute immediately
      jest.useFakeTimers();
      
      // Act
      const result = await localTwilioService.sendSmsWithTemplate(request);
      
      // Assert
      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[QUEUE] SMS to'));
      
      // Fast-forward timers
      jest.runAllTimers();
      
      // Check that sendSms was called after the timeout
      expect(localTwilioService.sendSms).toHaveBeenCalled();
      
      // Restore timers
      jest.useRealTimers();
    });
  });

  describe('bulkSendSms', () => {
    it('should send SMS to multiple recipients', async () => {
      // Arrange
      const recipients = ['+15551234567', '+15559876543', '+15555555555'];
      const body = 'Test bulk message';
      
      // Spy on sendSms method
      jest.spyOn(twilioService, 'sendSms')
        .mockResolvedValueOnce(true)  // First recipient succeeds
        .mockResolvedValueOnce(false) // Second recipient fails
        .mockResolvedValueOnce(true); // Third recipient succeeds
      
      // Act
      const result = await twilioService.bulkSendSms(recipients, body);
      
      // Assert
      expect(result.success).toBe(2);
      expect(result.failed).toBe(1);
      expect(twilioService.sendSms).toHaveBeenCalledTimes(3);
    });

    it('should handle errors during bulk sending', async () => {
      // Arrange
      const recipients = ['+15551234567', '+15559876543'];
      const body = 'Test bulk message';
      
      // Spy on sendSms method
      jest.spyOn(twilioService, 'sendSms')
        .mockResolvedValueOnce(true)           // First recipient succeeds
        .mockRejectedValueOnce(new Error('Error sending SMS')); // Second recipient throws error
      
      // Act
      const result = await twilioService.bulkSendSms(recipients, body);
      
      // Assert
      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
      expect(twilioService.sendSms).toHaveBeenCalledTimes(2);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error sending SMS to'),
        expect.any(Error)
      );
    });
  });

  describe('bulkSendSmsWithTemplate', () => {
    it('should send template SMS to multiple recipients', async () => {
      // Arrange
      const recipients = ['+15551234567', '+15559876543', '+15555555555'];
      const templateName = 'delivery_success';
      const variables = { orderId: '12345' };
      
      // Spy on sendSmsWithTemplate method
      jest.spyOn(twilioService, 'sendSmsWithTemplate')
        .mockResolvedValueOnce(true)  // First recipient succeeds
        .mockResolvedValueOnce(false) // Second recipient fails
        .mockResolvedValueOnce(true); // Third recipient succeeds
      
      // Act
      const result = await twilioService.bulkSendSmsWithTemplate(recipients, templateName, variables);
      
      // Assert
      expect(result.success).toBe(2);
      expect(result.failed).toBe(1);
      expect(twilioService.sendSmsWithTemplate).toHaveBeenCalledTimes(3);
    });
  });
});
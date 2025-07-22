import { Twilio } from 'twilio';

/**
 * SMS message template interface
 */
export interface SmsTemplate {
  name: string;
  content: string;
}

/**
 * SMS notification request interface
 */
export interface SmsRequest {
  to: string;
  templateName: string;
  variables: Record<string, string | number>;
}

/**
 * Service for handling Twilio SMS integration
 */
export class TwilioService {
  private client!: Twilio;
  private fromNumber: string = '';
  private templates: Map<string, SmsTemplate> = new Map();
  private queueEnabled: boolean = false;
  
  /**
   * Initialize Twilio service
   */
  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
    this.queueEnabled = process.env.ENABLE_SMS_QUEUE === 'true';
    
    // Initialize Twilio client if credentials are available
    if (accountSid && authToken) {
      this.client = new Twilio(accountSid, authToken);
    } else {
      console.warn('Twilio credentials not found. SMS functionality will be mocked.');
    }
    
    // Initialize SMS templates
    this.templates = new Map<string, SmsTemplate>();
    this.initializeTemplates();
  }
  
  /**
   * Initialize SMS templates
   */
  private initializeTemplates(): void {
    // Delivery status templates
    this.templates.set('delivery_success', {
      name: 'Delivery Success',
      content: 'Your order #{{orderId}} has been delivered successfully. Thank you for using our service!'
    });
    
    this.templates.set('delivery_failed', {
      name: 'Delivery Failed',
      content: 'Delivery attempt for order #{{orderId}} was unsuccessful due to {{reason}}. {{nextAction}} Contact support for assistance.'
    });
    
    this.templates.set('delivery_delayed', {
      name: 'Delivery Delayed',
      content: 'Your delivery for order #{{orderId}} is delayed by approximately {{delay}} minutes. We apologize for the inconvenience.'
    });
    
    this.templates.set('delivery_in_transit', {
      name: 'Delivery In Transit',
      content: 'Your order #{{orderId}} is now out for delivery. Track your delivery in real-time on our app.'
    });
    
    // Driver notification templates
    this.templates.set('driver_assignment', {
      name: 'Driver Assignment',
      content: 'You have been assigned to deliver order #{{orderId}}. Please check your app for details.'
    });
    
    this.templates.set('route_update', {
      name: 'Route Update',
      content: 'Your route has been updated. {{numStops}} stops, estimated completion time: {{estimatedTime}}.'
    });
    
    // Coordinator notification templates
    this.templates.set('coordinator_alert', {
      name: 'Coordinator Alert',
      content: 'Alert: {{alertType}} for order #{{orderId}}. {{details}}'
    });
  }
  
  /**
   * Get template by name
   */
  public getTemplate(templateName: string): SmsTemplate | undefined {
    return this.templates.get(templateName);
  }
  
  /**
   * Add or update template
   */
  public setTemplate(name: string, content: string): void {
    this.templates.set(name, { name, content });
  }
  
  /**
   * Process variables in template
   */
  private processTemplate(template: string, variables: Record<string, string | number>): string {
    let processedTemplate = template;
    
    // Replace all variables in the template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedTemplate = processedTemplate.replace(regex, String(value));
    });
    
    return processedTemplate;
  }
  
  /**
   * Send SMS using Twilio
   */
  public async sendSms(to: string, body: string): Promise<boolean> {
    try {
      // Check if Twilio client is initialized
      if (!this.client || !this.fromNumber) {
        console.log(`[MOCK] Sending SMS to ${to}: ${body}`);
        return true;
      }
      
      // Send SMS using Twilio
      const message = await this.client.messages.create({
        body,
        from: this.fromNumber,
        to
      });
      
      console.log(`SMS sent with SID: ${message.sid}`);
      return true;
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }
  
  /**
   * Send SMS using template
   */
  public async sendSmsWithTemplate(request: SmsRequest): Promise<boolean> {
    try {
      const { to, templateName, variables } = request;
      
      // Get template
      const template = this.templates.get(templateName);
      if (!template) {
        console.error(`Template not found: ${templateName}`);
        return false;
      }
      
      // Process template
      const body = this.processTemplate(template.content, variables);
      
      // Send SMS
      if (this.queueEnabled) {
        await this.queueSms(to, body);
        return true;
      } else {
        return await this.sendSms(to, body);
      }
    } catch (error) {
      console.error('Error sending SMS with template:', error);
      return false;
    }
  }
  
  /**
   * Queue SMS for later sending
   * In a real implementation, this would use a message queue like Redis or RabbitMQ
   */
  private async queueSms(to: string, body: string): Promise<void> {
    try {
      // In a real implementation, we would add the SMS to a queue
      console.log(`[QUEUE] SMS to ${to} queued for sending: ${body}`);
      
      // Simulate delayed processing
      setTimeout(async () => {
        try {
          await this.sendSms(to, body);
          console.log(`[QUEUE] Processed queued SMS to ${to}`);
        } catch (error) {
          console.error('[QUEUE] Error processing queued SMS:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('Error queueing SMS:', error);
      throw error;
    }
  }
  
  /**
   * Bulk send SMS to multiple recipients
   */
  public async bulkSendSms(recipients: string[], body: string): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    
    // Process each recipient
    for (const recipient of recipients) {
      try {
        const result = await this.sendSms(recipient, body);
        if (result) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Error sending SMS to ${recipient}:`, error);
        failed++;
      }
    }
    
    return { success, failed };
  }
  
  /**
   * Bulk send SMS with template to multiple recipients
   */
  public async bulkSendSmsWithTemplate(
    recipients: string[],
    templateName: string,
    variables: Record<string, string | number>
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    
    // Process each recipient
    for (const recipient of recipients) {
      try {
        const result = await this.sendSmsWithTemplate({
          to: recipient,
          templateName,
          variables
        });
        
        if (result) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Error sending template SMS to ${recipient}:`, error);
        failed++;
      }
    }
    
    return { success, failed };
  }
}
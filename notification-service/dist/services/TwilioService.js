"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioService = void 0;
const twilio_1 = require("twilio");
class TwilioService {
    constructor() {
        this.fromNumber = '';
        this.templates = new Map();
        this.queueEnabled = false;
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
        this.queueEnabled = process.env.ENABLE_SMS_QUEUE === 'true';
        if (accountSid && authToken) {
            this.client = new twilio_1.Twilio(accountSid, authToken);
        }
        else {
            console.warn('Twilio credentials not found. SMS functionality will be mocked.');
        }
        this.templates = new Map();
        this.initializeTemplates();
    }
    initializeTemplates() {
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
        this.templates.set('driver_assignment', {
            name: 'Driver Assignment',
            content: 'You have been assigned to deliver order #{{orderId}}. Please check your app for details.'
        });
        this.templates.set('route_update', {
            name: 'Route Update',
            content: 'Your route has been updated. {{numStops}} stops, estimated completion time: {{estimatedTime}}.'
        });
        this.templates.set('coordinator_alert', {
            name: 'Coordinator Alert',
            content: 'Alert: {{alertType}} for order #{{orderId}}. {{details}}'
        });
    }
    getTemplate(templateName) {
        return this.templates.get(templateName);
    }
    setTemplate(name, content) {
        this.templates.set(name, { name, content });
    }
    processTemplate(template, variables) {
        let processedTemplate = template;
        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            processedTemplate = processedTemplate.replace(regex, String(value));
        });
        return processedTemplate;
    }
    async sendSms(to, body) {
        try {
            if (!this.client || !this.fromNumber) {
                console.log(`[MOCK] Sending SMS to ${to}: ${body}`);
                return true;
            }
            const message = await this.client.messages.create({
                body,
                from: this.fromNumber,
                to
            });
            console.log(`SMS sent with SID: ${message.sid}`);
            return true;
        }
        catch (error) {
            console.error('Error sending SMS:', error);
            return false;
        }
    }
    async sendSmsWithTemplate(request) {
        try {
            const { to, templateName, variables } = request;
            const template = this.templates.get(templateName);
            if (!template) {
                console.error(`Template not found: ${templateName}`);
                return false;
            }
            const body = this.processTemplate(template.content, variables);
            if (this.queueEnabled) {
                await this.queueSms(to, body);
                return true;
            }
            else {
                return await this.sendSms(to, body);
            }
        }
        catch (error) {
            console.error('Error sending SMS with template:', error);
            return false;
        }
    }
    async queueSms(to, body) {
        try {
            console.log(`[QUEUE] SMS to ${to} queued for sending: ${body}`);
            setTimeout(async () => {
                try {
                    await this.sendSms(to, body);
                    console.log(`[QUEUE] Processed queued SMS to ${to}`);
                }
                catch (error) {
                    console.error('[QUEUE] Error processing queued SMS:', error);
                }
            }, 1000);
        }
        catch (error) {
            console.error('Error queueing SMS:', error);
            throw error;
        }
    }
    async bulkSendSms(recipients, body) {
        let success = 0;
        let failed = 0;
        for (const recipient of recipients) {
            try {
                const result = await this.sendSms(recipient, body);
                if (result) {
                    success++;
                }
                else {
                    failed++;
                }
            }
            catch (error) {
                console.error(`Error sending SMS to ${recipient}:`, error);
                failed++;
            }
        }
        return { success, failed };
    }
    async bulkSendSmsWithTemplate(recipients, templateName, variables) {
        let success = 0;
        let failed = 0;
        for (const recipient of recipients) {
            try {
                const result = await this.sendSmsWithTemplate({
                    to: recipient,
                    templateName,
                    variables
                });
                if (result) {
                    success++;
                }
                else {
                    failed++;
                }
            }
            catch (error) {
                console.error(`Error sending template SMS to ${recipient}:`, error);
                failed++;
            }
        }
        return { success, failed };
    }
}
exports.TwilioService = TwilioService;
//# sourceMappingURL=TwilioService.js.map
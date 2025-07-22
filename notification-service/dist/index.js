"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const NotificationService_1 = require("./services/NotificationService");
const TwilioService_1 = require("./services/TwilioService");
const FirebaseService_1 = require("./services/FirebaseService");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3005;
const notificationService = new NotificationService_1.NotificationService();
const twilioService = new TwilioService_1.TwilioService();
const firebaseService = new FirebaseService_1.FirebaseService();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/health', (req, res) => {
    return res.status(200).json({
        service: 'notification-service',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});
app.get('/', (req, res) => {
    return res.json({
        message: 'Notification Service API',
        version: '1.0.0'
    });
});
app.post('/api/notifications', async (req, res) => {
    try {
        const notificationRequest = req.body;
        if (!notificationRequest.orderId || !notificationRequest.status || !notificationRequest.customerName) {
            return res.status(400).json({
                error: 'Missing required fields',
                requiredFields: ['orderId', 'status', 'customerName']
            });
        }
        const result = await notificationService.processNotification(notificationRequest);
        if (result) {
            return res.status(200).json({
                message: 'Notification processed successfully',
                orderId: notificationRequest.orderId,
                status: notificationRequest.status
            });
        }
        else {
            return res.status(500).json({
                error: 'Failed to process notification',
                orderId: notificationRequest.orderId
            });
        }
    }
    catch (error) {
        console.error('Error processing notification request:', error);
        return res.status(500).json({ error: error.message });
    }
});
app.get('/api/notifications/:id', (req, res) => {
    const { id } = req.params;
    return res.status(200).json({
        id,
        status: 'delivered',
        sentAt: new Date().toISOString(),
        channels: ['sms', 'email']
    });
});
app.get('/api/sms/templates', (req, res) => {
    try {
        const templates = [];
        ['delivery_success', 'delivery_failed', 'delivery_delayed', 'delivery_in_transit',
            'driver_assignment', 'route_update', 'coordinator_alert'].forEach(templateName => {
            const template = twilioService.getTemplate(templateName);
            if (template) {
                templates.push(template);
            }
        });
        return res.status(200).json({ templates });
    }
    catch (error) {
        console.error('Error fetching SMS templates:', error);
        return res.status(500).json({ error: error.message });
    }
});
app.get('/api/sms/templates/:name', (req, res) => {
    try {
        const { name } = req.params;
        const template = twilioService.getTemplate(name);
        if (!template) {
            return res.status(404).json({ error: `Template '${name}' not found` });
        }
        return res.status(200).json({ template });
    }
    catch (error) {
        console.error('Error fetching SMS template:', error);
        return res.status(500).json({ error: error.message });
    }
});
app.post('/api/sms/templates', (req, res) => {
    try {
        const { name, content } = req.body;
        if (!name || !content) {
            return res.status(400).json({ error: 'Name and content are required' });
        }
        twilioService.setTemplate(name, content);
        return res.status(201).json({
            message: 'Template created successfully',
            template: { name, content }
        });
    }
    catch (error) {
        console.error('Error creating SMS template:', error);
        return res.status(500).json({ error: error.message });
    }
});
app.put('/api/sms/templates/:name', (req, res) => {
    try {
        const { name } = req.params;
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }
        const existingTemplate = twilioService.getTemplate(name);
        if (!existingTemplate) {
            return res.status(404).json({ error: `Template '${name}' not found` });
        }
        twilioService.setTemplate(name, content);
        return res.status(200).json({
            message: 'Template updated successfully',
            template: { name, content }
        });
    }
    catch (error) {
        console.error('Error updating SMS template:', error);
        return res.status(500).json({ error: error.message });
    }
});
app.post('/api/sms/send', async (req, res) => {
    try {
        const { to, body } = req.body;
        if (!to || !body) {
            return res.status(400).json({ error: 'To and body are required' });
        }
        const result = await twilioService.sendSms(to, body);
        if (result) {
            return res.status(200).json({ message: 'SMS sent successfully' });
        }
        else {
            return res.status(500).json({ error: 'Failed to send SMS' });
        }
    }
    catch (error) {
        console.error('Error sending SMS:', error);
        return res.status(500).json({ error: error.message });
    }
});
app.post('/api/sms/send-template', async (req, res) => {
    try {
        const { to, templateName, variables } = req.body;
        if (!to || !templateName || !variables) {
            return res.status(400).json({
                error: 'To, templateName, and variables are required',
                requiredFields: ['to', 'templateName', 'variables']
            });
        }
        const template = twilioService.getTemplate(templateName);
        if (!template) {
            return res.status(404).json({ error: `Template '${templateName}' not found` });
        }
        const result = await twilioService.sendSmsWithTemplate({ to, templateName, variables });
        if (result) {
            return res.status(200).json({ message: 'Template SMS sent successfully' });
        }
        else {
            return res.status(500).json({ error: 'Failed to send template SMS' });
        }
    }
    catch (error) {
        console.error('Error sending template SMS:', error);
        return res.status(500).json({ error: error.message });
    }
});
app.post('/api/notifications/devices', async (req, res) => {
    try {
        const { userId, deviceToken, deviceType, role } = req.body;
        if (!userId || !deviceToken || !deviceType || !role) {
            return res.status(400).json({
                error: 'Missing required fields',
                requiredFields: ['userId', 'deviceToken', 'deviceType', 'role']
            });
        }
        if (!['ios', 'android', 'web'].includes(deviceType)) {
            return res.status(400).json({
                error: 'Invalid device type',
                validTypes: ['ios', 'android', 'web']
            });
        }
        const registration = {
            userId,
            deviceToken,
            deviceType: deviceType,
            role,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const result = firebaseService.registerDevice(registration);
        if (result) {
            return res.status(201).json({
                message: 'Device registered successfully',
                deviceToken
            });
        }
        else {
            return res.status(500).json({ error: 'Failed to register device' });
        }
    }
    catch (error) {
        console.error('Error registering device:', error);
        return res.status(500).json({ error: error.message });
    }
});
app.delete('/api/notifications/devices', async (req, res) => {
    try {
        const { deviceToken } = req.body;
        if (!deviceToken) {
            return res.status(400).json({
                error: 'Device token is required',
                requiredFields: ['deviceToken']
            });
        }
        const result = firebaseService.unregisterDevice(deviceToken);
        if (result) {
            return res.status(200).json({
                message: 'Device unregistered successfully',
                deviceToken
            });
        }
        else {
            return res.status(404).json({ error: 'Device token not found' });
        }
    }
    catch (error) {
        console.error('Error unregistering device:', error);
        return res.status(500).json({ error: error.message });
    }
});
app.post('/api/notifications/push', async (req, res) => {
    try {
        const { title, body, data, tokens, priority, topic } = req.body;
        if (!title || !body || (!tokens && !topic)) {
            return res.status(400).json({
                error: 'Missing required fields',
                requiredFields: ['title', 'body', 'tokens OR topic']
            });
        }
        const result = await firebaseService.sendPushNotification({
            title,
            body,
            data: data || {},
            tokens: tokens || [],
            priority,
            topic
        });
        if (result) {
            return res.status(200).json({ message: 'Push notification sent successfully' });
        }
        else {
            return res.status(500).json({ error: 'Failed to send push notification' });
        }
    }
    catch (error) {
        console.error('Error sending push notification:', error);
        return res.status(500).json({ error: error.message });
    }
});
app.post('/api/notifications/push/role', async (req, res) => {
    try {
        const { role, title, body, data, priority } = req.body;
        if (!role || !title || !body) {
            return res.status(400).json({
                error: 'Missing required fields',
                requiredFields: ['role', 'title', 'body']
            });
        }
        const result = await firebaseService.sendRoleNotification(role, title, body, data || {}, priority);
        if (result) {
            return res.status(200).json({
                message: `Push notification sent successfully to role: ${role}`
            });
        }
        else {
            return res.status(500).json({ error: 'Failed to send push notification to role' });
        }
    }
    catch (error) {
        console.error('Error sending push notification to role:', error);
        return res.status(500).json({ error: error.message });
    }
});
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Notification Service running on port ${PORT}`);
    });
}
exports.default = app;
//# sourceMappingURL=index.js.map
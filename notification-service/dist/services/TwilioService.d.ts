export interface SmsTemplate {
    name: string;
    content: string;
}
export interface SmsRequest {
    to: string;
    templateName: string;
    variables: Record<string, string | number>;
}
export declare class TwilioService {
    private client;
    private fromNumber;
    private templates;
    private queueEnabled;
    constructor();
    private initializeTemplates;
    getTemplate(templateName: string): SmsTemplate | undefined;
    setTemplate(name: string, content: string): void;
    private processTemplate;
    sendSms(to: string, body: string): Promise<boolean>;
    sendSmsWithTemplate(request: SmsRequest): Promise<boolean>;
    private queueSms;
    bulkSendSms(recipients: string[], body: string): Promise<{
        success: number;
        failed: number;
    }>;
    bulkSendSmsWithTemplate(recipients: string[], templateName: string, variables: Record<string, string | number>): Promise<{
        success: number;
        failed: number;
    }>;
}
//# sourceMappingURL=TwilioService.d.ts.map
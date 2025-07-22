declare module 'firebase-admin' {
  interface App {
    // Add minimal type definitions needed for the tests
  }

  interface AppOptions {
    credential: any;
  }

  interface Credential {
    cert(serviceAccount: any): any;
  }

  interface Messaging {
    sendMulticast(message: any): Promise<any>;
    send(message: any): Promise<string>;
    subscribeToTopic(tokens: string[], topic: string): Promise<any>;
    unsubscribeFromTopic(tokens: string[], topic: string): Promise<any>;
  }

  const apps: App[];
  function initializeApp(options?: AppOptions): App;
  const credential: Credential;
  function messaging(): Messaging;

  export { apps, initializeApp, credential, messaging };
}
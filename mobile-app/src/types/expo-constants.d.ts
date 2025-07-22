declare module 'expo-constants' {
  interface ExpoConfig {
    extra?: {
      eas?: {
        projectId?: string;
      };
    };
  }

  const Constants: {
    expoConfig?: ExpoConfig;
  };

  export default Constants;
}
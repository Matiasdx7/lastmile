import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Define the auth API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Define types
interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  active: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Create a default admin user for development
  const defaultUser: User = {
    id: '00000000-0000-0000-0000-000000000000',
    username: 'admin',
    email: 'admin@lastmile.com',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin',
    active: true
  };
  
  const [user, setUser] = useState<User | null>(defaultUser); // Set default user
  const [isLoading, setIsLoading] = useState(false); // Set loading to false
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Set authenticated to true

  // Setup axios interceptor for authentication
  useEffect(() => {
    // For development, we're bypassing authentication
    console.log('Authentication bypassed for development');
    
    // Add a request interceptor that adds a mock token
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        // Add a mock authorization header to all requests
        config.headers['Authorization'] = 'Bearer mock-token-for-development';
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add a simplified response interceptor
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.message);
        return Promise.reject(error);
      }
    );

    // Clean up interceptors when component unmounts
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Mock login function - always succeeds
  const login = async (username: string, password: string) => {
    console.log('Mock login with:', username);
    // No actual authentication - just set the user and authenticated state
    setIsAuthenticated(true);
    return Promise.resolve();
  };

  // Mock logout function
  const logout = async () => {
    console.log('Mock logout');
    // For development, we'll keep the user authenticated
    return Promise.resolve();
  };

  // Mock refresh token function - always succeeds
  const refreshToken = async (): Promise<boolean> => {
    console.log('Mock token refresh');
    return Promise.resolve(true);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
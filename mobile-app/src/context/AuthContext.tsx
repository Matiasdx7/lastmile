import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Define the auth API URL
const API_URL = 'http://localhost:3001/api';

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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Setup axios interceptor for authentication
  useEffect(() => {
    // Add a request interceptor
    const requestInterceptor = axios.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('accessToken');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add a response interceptor
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If the error is 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Try to refresh the token
            const refreshed = await refreshToken();
            
            if (refreshed) {
              // Retry the original request
              const token = await SecureStore.getItemAsync('accessToken');
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            // If refresh fails, logout
            await logout();
          }
        }
        
        return Promise.reject(error);
      }
    );

    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('accessToken');
        if (token) {
          // Get user profile
          const response = await axios.get(`${API_URL}/auth/profile`);
          setUser(response.data);
          setIsAuthenticated(true);
        }
      } catch (error) {
        // Token might be invalid, try to refresh
        try {
          const refreshed = await refreshToken();
          if (!refreshed) {
            // Clear invalid tokens
            await SecureStore.deleteItemAsync('accessToken');
          }
        } catch (refreshError) {
          // Clear invalid tokens
          await SecureStore.deleteItemAsync('accessToken');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Clean up interceptors when component unmounts
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { username, password });
      
      // Store token securely
      await SecureStore.setItemAsync('accessToken', response.data.accessToken);
      
      // Store refresh token securely
      if (response.data.refreshToken) {
        await SecureStore.setItemAsync('refreshToken', response.data.refreshToken);
      }
      
      // Get user profile
      const userResponse = await axios.get(`${API_URL}/auth/profile`);
      setUser(userResponse.data);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      await axios.post(`${API_URL}/auth/logout`, { refreshToken });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear user data and tokens
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  // Refresh token function
  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      
      if (!refreshToken) {
        return false;
      }
      
      const response = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
      
      await SecureStore.setItemAsync('accessToken', response.data.accessToken);
      
      if (response.data.refreshToken) {
        await SecureStore.setItemAsync('refreshToken', response.data.refreshToken);
      }
      
      return true;
    } catch (error) {
      return false;
    }
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
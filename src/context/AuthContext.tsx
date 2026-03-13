import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../api/config';
import apiClient from '../api/client';

interface AuthContextType {
  user: any;
  token: string | null;
  loading: boolean;
  login: (username: string, pppoePassword?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(CONFIG.TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(CONFIG.USER_KEY);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to load auth', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password?: string) => {
    try {
      const response = await apiClient.post('/api/auth/login', {
        username,
        password,
      });

      const { user: userData, token: userToken } = response.data;

      // Extract token from cookie header if not in body, though our API sends in body usually
      // If our API sets httpOnly cookie, we might need to adjust or use the token from body
      
      await AsyncStorage.setItem(CONFIG.TOKEN_KEY, userToken);
      await AsyncStorage.setItem(CONFIG.USER_KEY, JSON.stringify(userData));
      
      setToken(userToken);
      setUser(userData);
    } catch (e: any) {
      throw new Error(e.response?.data?.error || 'Login failed');
    }
  };

  const logout = async () => {
    try {
        // Optional: call API logout
      await AsyncStorage.removeItem(CONFIG.TOKEN_KEY);
      await AsyncStorage.removeItem(CONFIG.USER_KEY);
      setToken(null);
      setUser(null);
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

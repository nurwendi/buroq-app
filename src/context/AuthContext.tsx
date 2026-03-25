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
        // Pre-emptively set state so UI feels fast
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Background verification to ensure token hasn't expired or been revoked
        try {
          const response = await apiClient.get('/api/auth/me');
          if (response.data && response.data.user) {
            setUser(response.data.user);
            await AsyncStorage.setItem(CONFIG.USER_KEY, JSON.stringify(response.data.user));
          }
        } catch (verifyError: any) {
          console.log('Session verification failed on startup:', verifyError.message);
          if (verifyError.response?.status === 401) {
             // Token is truly invalid, clear everything
             await logout();
          }
        }
      }
    } catch (e) {
      console.error('Failed to load auth', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password?: string) => {
    try {
      console.log('Attempting login for:', username);
      const response = await apiClient.post('/api/auth/login', {
        username,
        password,
      });

      console.log('Login response received:', response.status);
      
      const { user: userData, token: userToken } = response.data;

      if (!userToken || !userData) {
        console.error('Login successful but missing data:', response.data);
        throw new Error('Data login tidak lengkap dari server.');
      }
      
      await AsyncStorage.setItem(CONFIG.TOKEN_KEY, userToken);
      await AsyncStorage.setItem(CONFIG.USER_KEY, JSON.stringify(userData));
      
      setToken(userToken);
      setUser(userData);
      console.log('Login successful, token saved.');
    } catch (e: any) {
      console.error('Login process failed:', e.response?.data || e.message);
      throw new Error(e.response?.data?.error || e.message || 'Login failed');
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

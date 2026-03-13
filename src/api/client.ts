import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from './config';

const apiClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Helper to update the base URL at runtime (e.g., when the user changes server settings)
 */
export const updateApiBaseUrl = (newUrl: string) => {
  if (newUrl) {
    apiClient.defaults.baseURL = newUrl;
  }
};

// Add Interceptor to attach token to every request
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(CONFIG.TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add response interceptor for global error handling (e.g., 401 logout)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle auto-logout if needed
      await AsyncStorage.removeItem(CONFIG.TOKEN_KEY);
      await AsyncStorage.removeItem(CONFIG.USER_KEY);
    }
    return Promise.reject(error);
  }
);

export default apiClient;

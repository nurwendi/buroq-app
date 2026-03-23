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
    // If we get a 401, it means the token is invalid or expired.
    // We let the caller (AuthContext or components) handle this.
    // Silent storage clearing here often causes desync issues.
    return Promise.reject(error);
  }
);

export default apiClient;

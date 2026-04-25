import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }
  return 'http://localhost:5000';
};

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 60000,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
  },
});

// Request interceptor for Auth Token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      if (__DEV__) console.log(`[API] Requesting: ${config.url}`);
      config.withCredentials = true;
      let token = null;
      if (Platform.OS === 'web') {
        token = localStorage.getItem('better-auth.session_token');
      } else {
        token = await SecureStore.getItemAsync('better-auth.session_token');
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      if (__DEV__) console.error('[API] Interceptor Error:', err);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for Logging & Error Handling
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} -> ${response.status}`);
    }
    return response;
  },
  (error) => {
    if (__DEV__) {
      console.error(`[API ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;

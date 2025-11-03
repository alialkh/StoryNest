import axios from 'axios';
import Constants from 'expo-constants';

// IMPORTANT: Update this URL for production builds!
// For local development on Android emulator: http://10.0.0.1:4000
// For local development on physical device: http://YOUR_COMPUTER_IP:4000 (e.g., http://192.168.1.100:4000)
// For production: Update to your actual backend domain (e.g., https://api.storynest.com)
const apiUrl: string = Constants.expoConfig?.extra?.apiUrl ?? 'http://10.0.0.1:4000';

export const api = axios.create({
  baseURL: apiUrl,
  timeout: 15000
});

// Log API URL on creation (helps debug configuration issues)
console.log('[StoryNest API] Configured URL:', apiUrl);

// Add response error interceptor for better debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('[API Error] Status:', error.response.status, 'Data:', error.response.data);
    } else if (error.request) {
      // Request was made but no response
      console.error('[API Error] No response received. Request to:', error.request.url);
      console.error('[API Error] This usually means the backend is unreachable at:', apiUrl);
    } else {
      // Error in request setup
      console.error('[API Error] Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

import axios from 'axios';
import Constants from 'expo-constants';

const apiUrl: string = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:4000';

export const api = axios.create({
  baseURL: apiUrl,
  timeout: 15000
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

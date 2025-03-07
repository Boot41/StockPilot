// config/api.js
import axios from 'axios';

// API configuration
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? '' // Same origin in production
    : 'http://localhost:8000'; // Development server

// Get CSRF token function
const getCSRFToken = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/csrf/`, {
      withCredentials: true,
    });
    return response.data.csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    return null;
  }
};

// Create axios instance with default config
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

axiosInstance.interceptors.request.use(
  async (config) => {
    if (config.method !== 'get') {
      const token = await getCSRFToken();
      if (token) {
        config.headers['X-CSRFToken'] = token;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });
        const { access } = response.data;
        localStorage.setItem('access_token', access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return axiosInstance(originalRequest);
      } catch (error) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login/',
    REGISTER: '/auth/register/',
    LOGOUT: '/auth/logout/',
    REFRESH: '/auth/token/refresh/',
    FORGOT_PASSWORD: '/auth/forgot-password/',
    RESET_PASSWORD: '/auth/reset-password/',
    PROFILE: '/auth/profile/',
  },
  INVENTORY: {
    BASE: '/api/inventory/',
    // Sales forecasting (GET) and file upload (POST) use the same endpoint per your config
    FORECAST: '/api/forecast/',
    ANALYTICS: '/api/inventory/analytics/',
    // Use FORECAST_UPLOAD for file uploads (if different, adjust accordingly)
    FORECAST_UPLOAD: '/api/forecast/',
  },
  AI: {
    GEMINI_INSIGHTS: '/api/gemini-insights/',
  },
};

export const handleApiError = (error) => {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    if (status === 401) return { error: 'Please login to continue' };
    if (status === 403) return { error: 'You do not have permission to perform this action' };
    if (status === 404) return { error: 'Resource not found' };
    if (status === 400) return { error: data.error || 'Invalid request' };
    return { error: data.error || 'An error occurred' };
  } else if (error.request) {
    return { error: 'No response from server. Please check your connection.' };
  } else {
    return { error: 'Failed to make request. Please try again.' };
  }
};

export default API_ENDPOINTS;

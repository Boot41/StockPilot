// config/api.js
import axios from 'axios';

// API configuration
export const API_BASE_URL = 'http://localhost:8000';

// API endpoints
export const API_ENDPOINTS = {
    AUTH: {
        CSRF: '/auth/csrf/',
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
        FORECAST: '/api/forecast/',
        ANALYTICS: '/api/analytics/',
        INVENTORY: '/api/inventory/',
    },
    AI: {
        GEMINI_INSIGHTS: '/api/gemini-insights/',
    }
};

// Create axios instance with default config
export const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// Function to get CSRF token
export const fetchCSRFToken = async () => {
    try {
        const response = await axiosInstance.get(API_ENDPOINTS.AUTH.CSRF);
        const csrfToken = response.data.csrfToken;
        if (csrfToken) {
            axiosInstance.defaults.headers.common['X-CSRFToken'] = csrfToken;
        }
        return csrfToken;
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
        throw error;
    }
};

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
    (config) => {
        console.log('Making request to:', config.url);
        console.log('Request headers:', config.headers);
        
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
    (response) => {
        console.log('Response from:', response.config.url);
        console.log('Response status:', response.status);
        return response;
    },
    async (error) => {
        console.error('Response error:', error);
        console.error('Error response:', error.response);
        
        const originalRequest = error.config;

        // If error is 401 and we haven't tried refreshing token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REFRESH, {
                    refresh: refreshToken
                });

                const { access } = response.data;
                localStorage.setItem('access_token', access);

                // Retry the original request with new token
                originalRequest.headers.Authorization = `Bearer ${access}`;
                return axiosInstance(originalRequest);
            } catch (err) {
                // If refresh fails, clear tokens and redirect to login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

export default API_ENDPOINTS;

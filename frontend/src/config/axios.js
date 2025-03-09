import axios from 'axios';
import { API_BASE_URL } from './api';

// Create axios instance with default config
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Important for CORS with credentials
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Add request interceptor to add auth token and CSRF token
axiosInstance.interceptors.request.use(
    (config) => {
        // Add Authorization header if token exists
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Get CSRF token from cookies
        const csrfToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
            
        if (csrfToken) {
            config.headers['X-CSRFToken'] = csrfToken;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error is due to an expired token
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
                    refresh: refreshToken
                });

                const { access } = response.data;
                localStorage.setItem('access_token', access);
                
                // Retry the original request with the new token
                originalRequest.headers.Authorization = `Bearer ${access}`;
                return axios(originalRequest);
            } catch (refreshError) {
                // If refresh token is invalid, logout user
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;

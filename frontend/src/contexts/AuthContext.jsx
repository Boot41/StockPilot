// In /home/karan/Desktop/Ai_Inventory_project/frontend/src/contexts/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { axiosInstance, API_ENDPOINTS, fetchCSRFToken } from '../config/api'; // Import axiosInstance and API_ENDPOINTS

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decoded.exp && decoded.exp < currentTime) {
          logout();
        } else {
          setUser({ id: decoded.user_id, username: decoded.username });
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Invalid token', err);
        logout();
      }
    }
  }, [token]);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    
    try {
      // First ensure we have a CSRF token
      const csrfResponse = await fetchCSRFToken();
      console.log('CSRF Token Response:', csrfResponse);
      
      // Log the request payload
      console.log('Login Request Payload:', { username, password });
      
      // Attempt login
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, {
        username,
        password
      });

      console.log('Login Response:', response.data);

      const { user, access, refresh } = response.data;
      
      if (access && refresh) {
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        setToken(access);
        setUser(user);
        setIsAuthenticated(true);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Login error details:', {
        response: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers,
        error: err
      });
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

// In /home/karan/Desktop/Ai_Inventory_project/frontend/src/contexts/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

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

  const API_URL = 'http://127.0.0.1:8000/auth'; // Django backend URL

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
      const response = await axios.post(`${API_URL}/login/`, { username, password });

      const { access, refresh } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      const decodedUser = jwtDecode(access);
      setToken(access);
      setUser({ id: decodedUser.user_id, username: decodedUser.username });
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username, email, password, confirmPassword) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/register/`, { 
        username, 
        email, 
        password, 
        confirm_password: confirmPassword // Send confirm password
      });

      const { access, refresh } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      const decodedUser = jwtDecode(access);
      setToken(access);
      setUser({ id: decodedUser.user_id, username: decodedUser.username });
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Signup error:', err.response?.data || err.message);
      setError(err.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/forgot-password/`, { email });
      setLoading(false);
      return { success: true, message: "Password reset link has been sent to your email!" };
    } catch (err) {
      setLoading(false);
      const errorMessage = err.response?.data?.error || "Failed to send reset link";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      login,
      signup,
      logout,
      forgotPassword,
      loading,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
};

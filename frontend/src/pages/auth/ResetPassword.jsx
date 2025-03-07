// In /home/karan/Desktop/Ai_Inventory_project/frontend/src/pages/auth/ResetPassword.jsx
import React, { useState } from 'react';
import API_ENDPOINTS from '../../config/api';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { uidb64, token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post(`${API_ENDPOINTS.AUTH}/reset-password/${uidb64}/${token}/`, {
        password,
        confirm_password: confirmPassword
      });

      setIsSuccess(true);
      setMessage('Password reset successful!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Password reset failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-black text-white flex items-center justify-center">
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl p-12 w-full max-w-md mx-4 border border-gray-700/50">
        <h2 className="text-2xl font-bold mb-6">Reset Your Password</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm mb-2">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-700/50 rounded-xl border border-gray-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 bg-gray-700/50 rounded-xl border border-gray-600"
              required
            />
          </div>
          {message && (
            <div className={`p-3 rounded-xl ${isSuccess ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
              {message}
            </div>
          )}
          <button
            type="submit"
            className="w-full p-4 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl font-bold text-gray-900"
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
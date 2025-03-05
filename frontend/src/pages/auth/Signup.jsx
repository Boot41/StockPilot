import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { signup, loading, error } = useAuth();
  const navigate = useNavigate();

  const validatePassword = () => {
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return false;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    try {
      await signup(username, email, password, confirmPassword);
      navigate('/dashboard');
    } catch (err) {
      console.error('Signup failed', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-b from-blue-900 to-gray-900 text-white flex items-center justify-center"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-gray-800 p-10 rounded-2xl shadow-2xl w-full max-w-xl text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center mb-6"
        >
          <Package size={56} className="text-yellow-400 mb-2 animate-bounce" />
          <h2 className="text-3xl font-extrabold text-yellow-400">StockPilot</h2>
          <p className="text-gray-400 text-sm">AI-Powered Inventory Management</p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-red-50 border-l-4 border-red-400 p-3 text-sm text-red-700 mb-4 rounded-lg"
          >
            {error}
          </motion.div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
            <input
              type="text"
              placeholder="Full Name"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 p-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-yellow-400 border-none outline-none"
            />
          </div>

          <div className="relative">
            <input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 p-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-yellow-400 border-none outline-none"
            />
          </div>

          <div className="relative">
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 p-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-yellow-400 border-none outline-none"
            />
          </div>

          <div className="relative">
            <input
              type="password"
              placeholder="Confirm Password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full pl-10 p-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-yellow-400 border-none outline-none ${passwordError ? 'border-red-500' : ''}`}
            />
            {passwordError && <p className="mt-2 text-sm text-red-600">{passwordError}</p>}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-yellow-400 text-gray-900 rounded-lg font-bold hover:bg-yellow-500 transition-all"
          >
            {loading ? 'Signing up...' : 'Create Account'}
          </motion.button>
        </form>

        <p className="mt-4 text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-yellow-300 hover:text-yellow-200 font-medium">
            Sign in
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default Signup;

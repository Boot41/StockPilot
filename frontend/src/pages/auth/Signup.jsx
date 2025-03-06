import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Lock, User, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChartLine, FaShieldAlt, FaCloud, FaRobot } from 'react-icons/fa';

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
    if (!validatePassword()) return;

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
      transition={{ duration: 1 }}
      className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-black text-white flex items-center justify-center relative overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl p-12 w-full max-w-4xl mx-4 border border-gray-700/50"
      >
        <motion.div className="flex flex-col items-center mb-12">
          <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 4, repeat: Infinity }}>
            <Package size={64} className="text-yellow-400 mb-4 drop-shadow-glow" />
          </motion.div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-amber-300 bg-clip-text text-transparent">
            StockPilot
          </h2>
          <p className="text-gray-400 mt-2 text-lg">Enterprise Inventory Solution</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.form className="space-y-8" onSubmit={handleSubmit}>
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-900/30 p-4 rounded-xl border border-red-400/50"
                >
                  <div className="flex items-center gap-3 text-red-300">
                    <ShieldCheck size={20} />
                    <span className="text-sm">{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {['username', 'email', 'password', 'confirmPassword'].map((field, index) => (
              <motion.div
                key={field}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-transparent rounded-xl opacity-0 hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-4 bg-gray-700/30 backdrop-blur-sm rounded-xl p-4 border border-gray-600/50 hover:border-yellow-400/30 transition-all">
                  {field === 'username' && <User size={20} className="text-yellow-400" />}
                  {field === 'email' && <Mail size={20} className="text-yellow-400" />}
                  {field.includes('password') && <Lock size={20} className="text-yellow-400" />}
                  <input
                    type={field.includes('password') ? 'password' : 'text'}
                    placeholder={
                      field === 'username' ? 'Full Name' :
                      field === 'email' ? 'Email Address' :
                      field === 'password' ? 'Password' : 'Confirm Password'
                    }
                    required
                    value={eval(field)}
                    onChange={(e) => eval(`set${field.charAt(0).toUpperCase() + field.slice(1)}(e.target.value)`)}
                    className="w-full bg-transparent placeholder-gray-400 focus:outline-none text-lg"
                  />
                </div>
              </motion.div>
            ))}

            <motion.div className="pt-6 space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full p-4 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl font-bold text-gray-900 hover:shadow-xl transition-all relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-20 transition-opacity" />
                {loading ? 'Securing Account...' : 'Create Enterprise Account'}
              </motion.button>
            </motion.div>
          </motion.form>

          <motion.div className="hidden lg:block border-l border-gray-700/50 pl-12">
            <h3 className="text-2xl font-bold mb-8">Why StockPilot?</h3>
            <div className="space-y-8">
              {[
                { icon: <FaChartLine />, text: 'AI-Powered Forecasting' },
                { icon: <FaShieldAlt />, text: 'Military-Grade Security' },
                { icon: <FaCloud />, text: 'Global Cloud Infrastructure' },
                { icon: <FaRobot />, text: 'Smart Automation' }
              ].map((item, index) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 + index * 0.2 }}
                  className="flex items-center gap-4 text-gray-300 hover:text-yellow-400 transition-colors"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-lg">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.p className="mt-8 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-yellow-300 hover:text-yellow-200 font-medium underline-offset-4 hover:underline"
          >
            Access Enterprise Portal
          </Link>
          <br />
          <span className="text-xs mt-2 block opacity-70">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </span>
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default Signup;

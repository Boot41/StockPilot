import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { FaChartLine, FaCloud, FaRobot, FaLock, FaUser, FaEnvelope } from 'react-icons/fa';
import { FiCheckCircle } from 'react-icons/fi';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { signup, loading, error } = useAuth();
  const navigate = useNavigate();

  const passwordRequirements = [
    { text: 'Minimum 8 characters', regex: /.{8,}/ },
    { text: 'Uppercase letter', regex: /[A-Z]/ },
    { text: 'Number', regex: /[0-9]/ }
  ];

  const calculateStrength = (pass) => {
    let strength = 0;
    passwordRequirements.forEach((req, index) => {
      if (req.regex.test(pass)) strength += (index === 0 ? 40 : 30);
    });
    return Math.min(strength, 100);
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (field === 'password') {
      setPasswordStrength(calculateStrength(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setPasswordError('');

    try {
      await signup(formData.username, formData.email, formData.password, formData.confirmPassword);
      navigate('/dashboard');
    } catch (err) {
      console.error('Signup failed', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative overflow-hidden"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-white backdrop-blur-2xl rounded-2xl shadow-xl w-full max-w-4xl border border-gray-100"
      >
        <div className="flex flex-col lg:flex-row min-h-[700px]">
          {/* Auth Side */}
          <div className="flex-1 p-12 space-y-8 border-r border-gray-100">
            <motion.div className="flex flex-col items-center mb-12">
              <motion.div 
                animate={{ y: [0, -15, 0] }} 
                transition={{ duration: 4, repeat: Infinity }}
                className="mb-6"
              >
                <div className="text-6xl text-blue-600">
                  <FaUser />
                </div>
              </motion.div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Get Started with StockPilot
              </h2>
              <p className="text-gray-600 mt-2">Smart Inventory Management Platform</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Error Message */}
              <AnimatePresence>
                {(error || passwordError) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 p-4 rounded-xl border border-red-200"
                  >
                    <div className="flex items-center gap-3 text-red-600">
                      <FaLock className="text-lg" />
                      <span className="text-sm">{error || passwordError}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form Fields */}
              {['username', 'email', 'password', 'confirmPassword'].map((field, idx) => (
                <motion.div
                  key={field}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className="group relative"
                >
                  <div className="flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-all shadow-sm">
                    {field === 'username' && <FaUser className="text-blue-600" />}
                    {field === 'email' && <FaEnvelope className="text-blue-600" />}
                    {field.includes('password') && <FaLock className="text-blue-600" />}
                    <input
                      type={field.includes('password') ? 'password' : 'text'}
                      placeholder={
                        field === 'username' ? 'Full Name' :
                        field === 'email' ? 'Work Email' :
                        field === 'password' ? 'Create Password' : 'Confirm Password'
                      }
                      value={formData[field]}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                      className="w-full bg-transparent placeholder-gray-400 focus:outline-none text-lg"
                    />
                  </div>
                  
                  {field === 'password' && (
                    <div className="mt-4 space-y-2">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-400 to-cyan-400"
                          animate={{ width: `${passwordStrength}%` }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {passwordRequirements.map((req, i) => (
                          <div key={req.text} className="flex items-center gap-2">
                            <FiCheckCircle
                              className={`text-sm ${
                                req.regex.test(formData.password) ? 'text-blue-500' : 'text-gray-300'
                              }`}
                            />
                            <span className="text-xs text-gray-600">{req.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full p-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-bold hover:shadow-lg transition-all relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity" />
                <div className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <FaLock className="text-lg" />
                      <span>Start Free Trial</span>
                    </>
                  )}
                </div>
              </motion.button>

              {/* Existing User Link */}
              <motion.div 
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <Link
                  to="/login"
                  className="inline-block text-blue-600 hover:text-blue-700 text-lg font-medium px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Already have an account? Sign In →
                </Link>
              </motion.div>
            </form>
          </div>

          {/* Features Side */}
          <div className="flex-1 p-12 bg-gradient-to-br from-blue-50 to-cyan-50 hidden lg:block">
            <h3 className="text-2xl font-bold mb-8 text-blue-600">Why Choose StockPilot?</h3>
            <div className="space-y-8">
              {[
                { icon: <FaRobot className="text-3xl text-blue-500" />, 
                  title: "Smart Automation",
                  text: "Automated inventory tracking and replenishment" },
                { icon: <FaChartLine className="text-3xl text-cyan-500" />, 
                  title: "Real-time Analytics",
                  text: "Interactive dashboards with inventory insights" },
                { icon: <FaCloud className="text-3xl text-blue-400" />, 
                  title: "Cloud Sync",
                  text: "Access your inventory data from anywhere" },
                { icon: <FaUser className="text-3xl text-cyan-600" />, 
                  title: "Team Management",
                  text: "Multi-user access with role controls" }
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.2 }}
                  className="group flex items-start gap-4 p-4 rounded-xl hover:bg-white transition-all cursor-pointer border border-transparent hover:border-blue-100"
                >
                  <div className="text-blue-500 group-hover:text-blue-600 transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{item.title}</h4>
                    <p className="text-gray-600 text-sm mt-1">{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-blue-100">
              <div className="flex flex-col gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <FiCheckCircle className="text-blue-500" />
                  <span>Secure data protection</span>
                </div>
                <div className="flex items-center gap-3">
                  <FiCheckCircle className="text-blue-500" />
                  <span>24/7 customer support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Signup;
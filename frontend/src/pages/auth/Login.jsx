import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Package, User, Lock, Terminal, Shield } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
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
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 4 }}
        className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJub25lIiBzdHJva2U9IiM0ZjU1NjMiIHN0cm9rZS13aWR0aD0iMiIgb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-10"
      />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl p-12 w-full max-w-3xl mx-4 border border-gray-700/50"
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="flex flex-col items-center mb-12"
        >
          <motion.div
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="mb-6 relative"
          >
            <div className="absolute inset-0 bg-yellow-400/10 blur-2xl rounded-full" />
            <Package size={72} className="text-yellow-400 relative z-10" />
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-amber-300 bg-clip-text text-transparent">
            StockPilot
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Enterprise Inventory Platform</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-8"
            onSubmit={handleSubmit}
          >
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-900/30 p-4 rounded-xl border border-red-400/50 flex items-center gap-3"
                >
                  <Terminal size={20} className="text-red-300" />
                  <span className="text-red-300 text-sm">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {['username', 'password'].map((field, index) => (
              <motion.div
                key={field}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-transparent rounded-xl opacity-0 group-hover:opacity-30 transition-opacity" />
                <div className="flex items-center gap-4 bg-gray-700/30 backdrop-blur-sm rounded-xl p-4 border border-gray-600/50 hover:border-yellow-400/30 transition-all">
                  {field === 'username' ? (
                    <User size={20} className="text-yellow-400" />
                  ) : (
                    <Lock size={20} className="text-yellow-400" />
                  )}
                  <input
                    type={field === 'password' ? 'password' : 'text'}
                    placeholder={field === 'username' ? 'Username' : 'Password'}
                    value={field === 'username' ? username : password}
                    onChange={(e) => 
                      field === 'username' 
                        ? setUsername(e.target.value) 
                        : setPassword(e.target.value)
                    }
                    className="w-full bg-transparent placeholder-gray-400 focus:outline-none text-lg"
                  />
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="pt-6"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full p-4 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl font-bold text-gray-900 hover:shadow-xl transition-all relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-20 transition-opacity" />
                {loading ? (
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    Authenticating...
                  </motion.span>
                ) : (
                  'Access Enterprise Portal'
                )}
              </motion.button>
            </motion.div>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="hidden lg:block border-l border-gray-700/50 pl-12"
          >
            <h3 className="text-2xl font-bold mb-8">Advanced Protection</h3>
            <div className="space-y-8">
              {[
                { icon: <Shield />, text: 'Multi-Factor Authentication' },
                { icon: <Lock />, text: 'End-to-End Encryption' },
                { icon: <Terminal />, text: 'Real-Time Threat Detection' },
                { icon: <Package />, text: 'Hardware Security Modules' }
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

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="mt-12 pt-8 border-t border-gray-700/50"
            >
              {/* This block has been removed */}
            </motion.div>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="mt-8 text-center text-sm text-gray-400"
        >
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-yellow-300 hover:text-yellow-200 font-medium underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </motion.p>
        <div className="text-center mt-4">
          <Link
            to="/forgot-password"
            className="text-yellow-300 hover:text-yellow-200 font-medium underline-offset-4 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>
      </motion.div>

      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: -1 }}
      >
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.4, 0],
              x: Math.random() * 100 - 50,
              y: Math.random() * 100 - 50,
            }}
            transition={{
              duration: Math.random() * 6 + 4,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            className="absolute w-0.5 h-0.5 bg-yellow-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default Login;
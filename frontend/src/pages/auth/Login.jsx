import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Package, User, Lock } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { motion } from "framer-motion";

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
          <motion.div
            animate={{
              y: [0, -10, 10, -10, 10, 0], // Vertical wiggle animation
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "loop", // Continuous loop
              ease: "easeInOut",
            }}
          >
            <Package size={56} className="text-yellow-400 mb-2" />
          </motion.div>
          <h2 className="text-3xl font-extrabold text-yellow-400">
            StockPilot
          </h2>
          <p className="text-gray-400 text-sm">
            AI-Powered Inventory Management
          </p>
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
            <User
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 p-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-yellow-400 border-none outline-none"
            />
          </div>

          <div className="relative">
            <Lock
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 p-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-yellow-400 border-none outline-none"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-yellow-400 text-gray-900 rounded-lg font-bold hover:bg-yellow-500 transition-all"
          >
            {loading ? "Signing in..." : "Sign in"}
          </motion.button>
        </form>

        <p className="mt-4 text-sm text-gray-400">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-yellow-300 hover:text-yellow-200 font-medium"
          >
            Sign up
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default Login;

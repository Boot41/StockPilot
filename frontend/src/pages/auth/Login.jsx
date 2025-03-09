import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { FaUser, FaLock, FaRobot, FaChartLine, FaCloud, FaChartBar } from "react-icons/fa";
import ErrorBoundary from "../../components/ErrorBoundary";

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/dashboard";

    // Fetch CSRF token on component mount
    useEffect(() => {
        const fetchCSRFToken = async () => {
            try {
                const response = await fetch("http://localhost:8000/auth/csrf/", {
                    credentials: "include",
                });
                if (!response.ok) {
                    throw new Error("Failed to fetch CSRF token");
                }
            } catch (err) {
                console.error("Error fetching CSRF token:", err);
            }
        };
        fetchCSRFToken();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // First ensure we have a CSRF token
            console.log("Fetching CSRF token...");
            const fetchCSRFToken = async () => {
                try {
                    const response = await fetch("http://localhost:8000/auth/csrf/", {
                        credentials: "include",
                    });
                    if (!response.ok) {
                        throw new Error("Failed to fetch CSRF token");
                    }
                } catch (err) {
                    console.error("Error fetching CSRF token:", err);
                }
            };
            await fetchCSRFToken();
            
            console.log("Attempting login with:", { username, password });
            await login(username, password);
            console.log("Login successful, navigating to:", from);
            navigate(from, { replace: true });
        } catch (err) {
            console.error("Login error:", err);
            console.error("Error response:", err.response?.data);
            setError(err.response?.data?.detail || "Failed to log in. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4 relative overflow-hidden"
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
                                Welcome Back
                            </h2>
                            <p className="text-gray-600 mt-2">Smart Inventory Management Platform</p>
                        </motion.div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-red-50 p-4 rounded-xl border border-red-200"
                                    >
                                        <div className="flex items-center gap-3 text-red-600">
                                            <FaLock className="text-lg" />
                                            <span className="text-sm">{error}</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {['username', 'password'].map((field, idx) => (
                                <motion.div
                                    key={field}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + idx * 0.1 }}
                                    className="group relative"
                                >
                                    <div className="flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-all shadow-sm">
                                        {field === 'username' ? (
                                            <FaUser className="text-blue-600" />
                                        ) : (
                                            <FaLock className="text-blue-600" />
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
                                            <span>Signing In...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaLock className="text-lg" />
                                            <span>Access Dashboard</span>
                                        </>
                                    )}
                                </div>
                            </motion.button>

                            <div className="flex flex-col gap-4 text-center">
                                <Link
                                    to="/signup"
                                    className="text-blue-600 hover:text-blue-700 text-lg font-medium px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                    Don't have an account? Start Free Trial →
                                </Link>
                                <Link
                                    to="/forgot-password"
                                    className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                        </form>
                    </div>

                    {/* Features Side */}
                    <div className="flex-1 p-12 bg-gradient-to-br from-blue-50 to-cyan-50 hidden lg:block">
                        <h3 className="text-2xl font-bold mb-8 text-blue-600">Why StockPilot?</h3>
                        <div className="space-y-8">
                            {[
                                { icon: <FaRobot className="text-3xl text-blue-500" />, 
                                  title: "Smart Automation",
                                  text: "Automated inventory tracking and replenishment" },
                                { icon: <FaChartBar className="text-3xl text-cyan-500" />, 
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
                                    <FaUser className="text-blue-500" />
                                    <span>24/7 dedicated support team</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <FaLock className="text-blue-500" />
                                    <span>Secure data encryption</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Login;
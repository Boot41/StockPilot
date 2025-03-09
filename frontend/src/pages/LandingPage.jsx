import React, { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { 
  FaChartLine, FaRobot, FaWarehouse, FaFileExcel, 
  FaBoxes, FaCloudUploadAlt, FaMobileAlt, FaCommentDots,
  FaTwitter, FaLinkedin, FaGithub, FaRegEnvelope
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { CommonComponents } from '../components/CommonComponents';
import useAnalytics from "../hooks/useAnalytics";
import api from "../services/api";

export default function LandingPage() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { trackEvent } = useAnalytics();

  const scaleX = useTransform(scrollYProgress, [0, 1], [0.2, 1]);

  const handleTrialStart = async () => {
    try {
      setLoading(true);
      await api.startTrial();
      trackEvent('free_trial_started');
      navigate("/signup");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 text-gray-900 overflow-hidden relative">
      <CommonComponents 
        loading={loading} 
        error={error} 
        onDismissError={() => setError(null)} 
        isChatOpen={isChatOpen} 
        onCloseChat={() => setIsChatOpen(false)} 
      />
      
      {/* Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 to-cyan-500 origin-left z-50" 
        style={{ scaleX }}
      />

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Revolutionize Inventory Management with{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                StockPilot
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Harness AI-powered insights to optimize stock levels, predict demand patterns,
              and streamline inventory operations in real-time.
            </p>

            <div className="flex gap-6 items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleTrialStart}
                className="text-lg px-8 py-4 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white rounded-lg shadow-xl transition-all"
              >
                Start Free Trial
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl shadow-2xl overflow-hidden border-2 border-white bg-white">
              <div className="h-96 bg-gradient-to-br from-indigo-50 to-cyan-50 relative overflow-hidden">
                <motion.div
                  animate={{ 
                    y: [0, -15, 0],
                    opacity: [0.9, 1, 0.9]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 min-w-[300px]">
                    <FaRobot className="text-6xl text-cyan-500 mb-4 mx-auto animate-pulse" />
                    <p className="text-xl font-bold text-gray-900 text-center mb-2">
                      AI Recommendation
                    </p>
                    <motion.p 
                      className="text-lg text-gray-600 text-center"
                      animate={{ opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Optimal Order Detected
                    </motion.p>
                    <div className="mt-4 h-2 bg-cyan-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-cyan-500"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-16"
          >
            Intelligent Inventory Features
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
              >
                <div className={`mb-6 text-5xl ${feature.color}`}>
                  <feature.icon />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-cyan-500">
        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="text-white">
            <motion.h2 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="text-4xl font-bold mb-8"
            >
              Smart Spreadsheet Integration
            </motion.h2>
            
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-white/10 rounded-xl">
                  <FaFileExcel className="text-4xl" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Real-time Data Sync</h3>
                  <p className="text-indigo-100">Instant synchronization with existing spreadsheets</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="p-4 bg-white/10 rounded-xl">
                  <FaRobot className="text-4xl" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Smart Data Analysis</h3>
                  <p className="text-indigo-100">Automatic pattern recognition and insights</p>
                </div>
              </div>
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative rounded-2xl overflow-hidden shadow-2xl bg-white/10 backdrop-blur-lg"
          >
            <div className="p-6">
              <div className="bg-white/5 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-white/10 flex gap-4">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                </div>
                <div className="p-4 grid gap-4">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="h-3 bg-white/10 rounded-full animate-pulse"
                      style={{ width: `${80 - i * 10}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Floating Chat Trigger */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-8 right-8 bg-gradient-to-br from-indigo-600 to-cyan-500 text-white p-5 rounded-full shadow-2xl flex items-center gap-3 group"
      >
        <div className="relative">
          <FaCommentDots className="text-2xl" />
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full animate-ping" />
        </div>
        <span className="font-semibold group-hover:scale-105 transition-transform">
          AI Assistant
        </span>
      </motion.button>
    </div>
  );
}

const features = [
  {
    title: "Predictive Analytics",
    icon: FaChartLine,
    color: "text-cyan-500",
    description: "Machine learning models forecasting demand with 98% accuracy"
  },
  {
    title: "Auto-Replenishment",
    icon: FaCloudUploadAlt,
    color: "text-indigo-500",
    description: "Intelligent inventory automation with supplier integration"
  },
  {
    title: "Multi-Warehouse Sync",
    icon: FaWarehouse,
    color: "text-purple-500",
    description: "Real-time inventory tracking across locations"
  },
  {
    title: "Mobile Management",
    icon: FaMobileAlt,
    color: "text-green-500",
    description: "Real-time mobile inventory tracking and management"
  },
  {
    title: "Smart Auditing",
    icon: FaBoxes,
    color: "text-orange-500",
    description: "Automated inventory checks with instant alerts"
  },
  {
    title: "Live AI Support",
    icon: FaCommentDots,
    color: "text-pink-500",
    description: "Instant inventory insights through natural conversation"
  }
];
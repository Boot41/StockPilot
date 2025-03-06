import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { FaChartLine, FaBolt, FaDatabase, FaRobot, FaCloud, FaShieldAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Button from "../components/Ui/Button";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-black text-white overflow-hidden relative">
      {/* Animated Background Elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMiIgaGVpZ2h0PSIyIiBmaWxsPSIjZmZmZmZmIi8+PC9zdmc+')]"
      />
      
      <div className="container mx-auto px-6 py-24 relative z-10">
        {/* Grid Layout - Hero + Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Left - Hero Text */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="absolute -top-20 -left-20 w-72 h-72 bg-gradient-to-r from-yellow-400/20 to-transparent rounded-full blur-2xl" />
            
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 1 }}
              className="text-7xl md:text-8xl font-bold bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent mb-6"
            >
              StockPilot
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 1 }}
              className="text-2xl font-light text-gray-300 mb-8"
            >
              Enterprise-Grade AI Inventory Optimization
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 1 }}
              className="flex gap-6 items-center"
            >
              <Button
                onClick={() => navigate("/signup")}
                className="text-lg px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 transition-all"
              >
                Start Free Trial
              </Button>
              <button className="text-gray-300 hover:text-white transition-colors">
                Watch Demo →
              </button>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-16 flex items-center gap-8 text-gray-400"
            >
              <div className="h-px bg-gray-700 flex-1" />
              <span className="text-sm">Fueling Business Growth</span>
              <div className="h-px bg-gray-700 flex-1" />
            </motion.div>
          </motion.div>

          {/* Right - Animated Feature Grid */}
          <div className="grid grid-cols-2 gap-6 relative">
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-gradient-to-l from-blue-600/20 to-transparent rounded-full blur-2xl" />
            
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 + 0.5 }}
                className="group relative bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 hover:border-yellow-400/30 transition-all hover:shadow-2xl hover:-translate-y-2"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <feature.icon className="text-5xl mb-6 text-yellow-400" />
                <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Floating AI Elements */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute right-0 top-1/3 -translate-y-1/2 opacity-10"
        >
          <div className="text-9xl opacity-50 blur-lg">
            <FaRobot />
          </div>
        </motion.div>
      </div>

      {/* Animated Circuit Border */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute inset-0 border-[16px] border-dashed border-yellow-400/10 rounded-xl m-4" />
      </motion.div>
    </div>
  );
}

const features = [
  {
    title: "Predictive Analytics",
    icon: FaChartLine,
    description: "Deep learning algorithms forecast demand with 98% accuracy"
  },
  {
    title: "Auto-Replenishment",
    icon: FaBolt,
    description: "Smart inventory automation with real-time adjustments"
  },
  {
    title: "Supply Chain AI",
    icon: FaDatabase,
    description: "End-to-end optimization across your entire network"
  },
  {
    title: "Risk Analysis",
    icon: FaShieldAlt,
    description: "Real-time threat detection and mitigation systems"
  },
  {
    title: "Cloud Native",
    icon: FaCloud,
    description: "Global deployment with multi-cloud infrastructure"
  },
  {
    title: "Smart Audit",
    icon: FaRobot,
    description: "Automated cycle counting with computer vision"
  }
];
import React from "react";
import { motion } from "framer-motion";
import { FaChartLine, FaBolt, FaDatabase } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Button from "../components/Ui/Button";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-gradient-to-b from-blue-900 to-gray-900 text-white flex flex-col items-center justify-center px-8">
      {/* Grid Layout - Hero + Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-7xl w-full items-center">
        {/* Left - Hero Text */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center lg:text-left mt-[-100px] ml-[-30px]"
        >
          <h1 className="text-[6rem] font-extrabold text-yellow-400 mb-1">
            StockPilot
          </h1>
          <h2 className="text-lg font-medium text-gray-300 mb-10">
            AI-Powered Inventory Management
          </h2>
          <p className="text-xl font-medium opacity-90 leading-relaxed mb-16">
            Smarter inventory, zero stock issues. AI-driven forecasts & automation for effortless management.
          </p>
          <div className="mt-16"> {/* Spacing before button */}
            <Button onClick={() => navigate("/signup")} className="text-xl px-10 py-4">
              Get Started
            </Button>
          </div>
        </motion.div>

        {/* Right - Features */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-2 gap-8"
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-800 p-10 rounded-3xl shadow-xl flex flex-col items-center text-center hover:scale-105 transition-transform duration-300"
            >
              <feature.icon className="text-yellow-400 text-6xl mb-5" />
              <h3 className="text-2xl font-bold">{feature.title}</h3>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

const features = [
  { title: "AI-Driven Analytics", icon: FaChartLine },
  { title: "Predictive Insights", icon: FaBolt },
  { title: "Quick & Easy Setup", icon: FaDatabase },
  { title: "Optimized Stock Levels", icon: FaChartLine },
  { title: "Smart Forecasting AI", icon: FaBolt },
  { title: "Interactive Dashboard", icon: FaDatabase },
];

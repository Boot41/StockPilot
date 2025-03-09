import React, { useState } from "react";
import { motion } from "framer-motion";
import MainLayout from '@layouts/MainLayout';
import ErrorBoundary from '../../components/ErrorBoundary';

const Settings = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  const handleEmailToggle = () => {
    setEmailNotifications(!emailNotifications);
    // Add logic to update email notification settings
  };

  const handleSmsToggle = () => {
    setSmsNotifications(!smsNotifications);
    // Add logic to update SMS notification settings
  };

  return (
    <ErrorBoundary>
      <MainLayout>
        <div className="bg-gray-100 text-gray-900 min-h-screen flex flex-col items-center justify-center">
          <div className="container mx-auto p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="p-10 bg-gradient-to-b from-white to-gray-200 rounded-2xl shadow-lg"
            >
              <h1 className="text-3xl font-bold mb-8 text-center text-blue-600">Settings</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Email Notifications */}
                <motion.div whileHover={{ scale: 1.03 }}>
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">Email Notifications</h2>
                  <p className="text-lg text-gray-600 mb-4">Receive updates and alerts via email.</p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={emailNotifications}
                      onChange={handleEmailToggle}
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-400 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </motion.div>

                {/* SMS Notifications */}
                <motion.div whileHover={{ scale: 1.03 }}>
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">SMS Notifications</h2>
                  <p className="text-lg text-gray-600 mb-4">Receive updates and alerts via SMS.</p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={smsNotifications}
                      onChange={handleSmsToggle}
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-400 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </MainLayout>
    </ErrorBoundary>
  );
};

export default Settings;
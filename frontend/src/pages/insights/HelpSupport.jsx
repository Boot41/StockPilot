import React from "react";
import { motion } from "framer-motion";
import { Phone, Mail } from "lucide-react";
import MainLayout from '@layouts/MainLayout';
import ErrorBoundary from '../../components/ErrorBoundary';

const HelpSupport = () => {
  return (
    <ErrorBoundary>
      <MainLayout>
        <div className="bg-gray-100 text-gray-900 min-h-screen">
          <div className="container mx-auto p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="p-10 bg-gradient-to-b from-white to-gray-200 rounded-2xl shadow-lg"
            >
              <h1 className="text-4xl font-bold mb-8 text-center text-blue-600">Help & Support</h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-6">
                {/* Contact Section */}
                <div>
                  <h2 className="text-2xl font-semibold mb-6 text-gray-800">Contact Us</h2>
                  <p className="text-lg text-gray-600 mb-8">
                    Have questions or need assistance? Reach out to our dedicated support team.
                  </p>
                  <ul className="text-lg text-gray-600 space-y-4">
                    <motion.li
                      whileHover={{ scale: 1.05, originX: 0 }}
                      className="flex items-center"
                    >
                      <Phone size={20} className="mr-3 text-blue-500" />
                      <span>Phone: +91-9672618163</span>
                    </motion.li>
                    <motion.li
                      whileHover={{ scale: 1.05, originX: 0 }}
                      className="flex items-center"
                    >
                      <Mail size={20} className="mr-3 text-blue-500" />
                      <span>Email: support@stockpilot.com</span>
                    </motion.li>
                  </ul>
                </div>

                {/* FAQ Section */}
                <div>
                  <h2 className="text-2xl font-semibold mb-6 text-gray-800">Frequently Asked Questions</h2>
                  <div className="space-y-8">
                    {/* FAQ Item 1 */}
                    <motion.div whileHover={{ scale: 1.03 }}>
                      <h3 className="font-semibold text-xl mb-3">What is StockPilot?</h3>
                      <p className="text-lg text-gray-600">
                        StockPilot is an AI-powered inventory forecasting tool that helps businesses optimize their stock levels and prevent stockouts or overstocking.
                      </p>
                    </motion.div>

                    {/* FAQ Item 2 */}
                    <motion.div whileHover={{ scale: 1.03 }}>
                      <h3 className="font-semibold text-xl mb-3">How does the AI work?</h3>
                      <p className="text-lg text-gray-600">
                        Our AI algorithms analyze historical sales data, trends, and other factors to predict future demand and provide accurate forecasts.
                      </p>
                    </motion.div>

                    {/* FAQ Item 3 */}
                    <motion.div whileHover={{ scale: 1.03 }}>
                      <h3 className="font-semibold text-xl mb-3">What are the benefits?</h3>
                      <p className="text-lg text-gray-600">
                        StockPilot helps reduce inventory costs, improve customer satisfaction, and increase overall efficiency.
                      </p>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Footer */}
            <div className="mt-24 text-center text-gray-500">
              <p className="text-base">&copy; 2025 StockPilot. All rights reserved.</p>
              <p className="text-base mt-2">Created by Karan Singh Rawat.</p>
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <span>Disclaimer</span>
                <span>Privacy Policy</span>
                <span>Terms of Service</span>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </ErrorBoundary>
  );
};

export default HelpSupport;
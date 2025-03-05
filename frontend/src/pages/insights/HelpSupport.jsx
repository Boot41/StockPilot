import React from "react";
import { motion } from "framer-motion";
import { Phone, Mail } from "lucide-react";

const HelpSupport = () => {
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="container mx-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="p-10 bg-gradient-to-b from-blue-900 to-gray-900 rounded-2xl shadow-lg"
        >
          <h1 className="text-4xl font-bold mb-8 text-center text-yellow-400"> {/* Added Color */}
            Help & Support
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-6"> {/* Added Margin Top */}
            {/* Contact Section */}
            <div>
              <h2 className="text-2xl font-semibold mb-6 text-gray-300">
                Contact Us
              </h2>
              <p className="text-lg text-gray-400 mb-8">
                Have questions or need assistance? Reach out to our dedicated
                support team.
              </p>
              <ul className="text-lg text-gray-400 space-y-4">
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
              <h2 className="text-2xl font-semibold mb-6 text-gray-300">
                Frequently Asked Questions
              </h2>
              <div className="space-y-8">
                {/* FAQ Item 1 */}
                <motion.div whileHover={{ scale: 1.03 }}>
                  <h3 className="font-semibold text-xl mb-3">
                    What is StockPilot?
                  </h3>
                  <p className="text-lg text-gray-400">
                    StockPilot is an AI-powered inventory forecasting tool that
                    helps businesses optimize their stock levels and prevent
                    stockouts or overstocking.
                  </p>
                </motion.div>

                {/* FAQ Item 2 */}
                <motion.div whileHover={{ scale: 1.03 }}>
                  <h3 className="font-semibold text-xl mb-3">
                    How does the AI work?
                  </h3>
                  <p className="text-lg text-gray-400">
                    Our AI algorithms analyze historical sales data, trends, and
                    other factors to predict future demand and provide accurate
                    forecasts.
                  </p>
                </motion.div>

                {/* FAQ Item 3 */}
                <motion.div whileHover={{ scale: 1.03 }}>
                  <h3 className="font-semibold text-xl mb-3">
                    What are the benefits?
                  </h3>
                  <p className="text-lg text-gray-400">
                    StockPilot helps reduce inventory costs, improve customer
                    satisfaction, and increase overall efficiency.
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
  );
};

export default HelpSupport;
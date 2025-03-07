import React, { useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
  CartesianGrid,
  Legend,
  Label,
} from "recharts";
import MainLayout from "../../components/layout/MainLayout";
import ErrorBoundary from "../../components/ErrorBoundary";
import { motion, AnimatePresence } from "framer-motion";
import { FaFileImport, FaSpinner } from "react-icons/fa";
import { FiTrendingUp, FiAlertCircle, FiUploadCloud } from "react-icons/fi";

const ForecastChart = ({ data }) => {
  const isValid = Array.isArray(data) && data.length > 0 && 
    data.every(d => d?.product && d?.predicted_sales && d?.confidence);

  return (
    <motion.div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-600/30 backdrop-blur-lg">
      <h3 className="text-xl font-bold mb-4 text-amber-400">
        📈 Sales Forecast & Confidence
      </h3>
      
      {isValid ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
            <XAxis
              dataKey="product"
              angle={-45}
              textAnchor="end"
              tick={{ fill: '#9ca3af' }}
              label={{
                value: "Products",
                position: "bottom",
                offset: 40,
                fill: '#9ca3af'
              }}
            />
            <YAxis yAxisId="left" tick={{ fill: '#9ca3af' }}>
              <Label
                value="Predicted Sales ($)"
                angle={-90}
                position="left"
                offset={-10}
                fill='#9ca3af'
              />
            </YAxis>
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#9ca3af' }}
              domain={[0, 100]}
            >
              <Label
                value="Confidence Score (%)"
                angle={90}
                position="right"
                offset={-10}
                fill='#9ca3af'
              />
            </YAxis>
            <Tooltip
              contentStyle={{
                background: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.5)"
              }}
              formatter={(value, name) => {
                if (name === 'Predicted Sales') return [`$${Number(value).toLocaleString()}`, name];
                if (name === 'Confidence Score') return [`${value}%`, name];
                return [value, name];
              }}
            />
            <Bar
              yAxisId="left"
              dataKey="predicted_sales"
              name="Predicted Sales"
              fill="#f59e0b"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="confidence"
              name="Confidence Score"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: "#059669", strokeWidth: 2 }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: 20 }}
              formatter={(value) => <span className="text-gray-300">{value}</span>}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400">⚠️ No forecast data available</p>
          <p className="text-sm text-gray-500 mt-2">
            Upload a valid dataset to generate predictions
          </p>
        </div>
      )}
    </motion.div>
  );
};

const InventoryHealth = ({ health }) => {
  const status = {
    high: { color: "bg-green-500", text: "Optimal Inventory Levels" },
    medium: { color: "bg-amber-500", text: "Moderate Inventory Risk" },
    low: { color: "bg-red-500", text: "Critical Inventory Shortage" }
  };

  return (
    <motion.div className="bg-gray-800/50 p-6 rounded-2xl border border-amber-500/30 backdrop-blur-lg">
      <div className="flex items-center gap-3 mb-4">
        <FiAlertCircle className="text-amber-500 text-2xl" />
        <h3 className="text-xl font-bold text-amber-500">Inventory Health Status</h3>
      </div>
      
      {health?.status ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${status[health.status].color}`} />
            <p className="text-lg font-semibold text-gray-300">
              {status[health.status].text}
            </p>
          </div>
          <div className="space-y-2">
            {health.insights?.map((insight, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                <p className="text-gray-400">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-400">No health analysis available</p>
      )}
    </motion.div>
  );
};

const ProductList = ({ title, items, type }) => {
  const isValid = Array.isArray(items) && items.length > 0;

  return (
    <motion.div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-600/30 backdrop-blur-lg">
      <div className="flex items-center gap-3 mb-4">
        {type === 'fast' ? (
          <FiTrendingUp className="text-green-500 text-2xl" />
        ) : (
          <FiAlertCircle className="text-red-500 text-2xl" />
        )}
        <h3 className="text-xl font-bold text-amber-400">{title}</h3>
      </div>
      
      {isValid ? (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={`${type}-${item.product || i}`} className="p-3 bg-gray-700/20 rounded-lg hover:bg-gray-700/40 transition-colors">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 font-medium">
                  {item.product || `Product ${i + 1}`}
                </span>
                <span className={`text-sm ${
                  type === 'fast' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {type === 'fast' ? '↑ High Demand' : '↓ Low Movement'}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>Current Stock: {item.stock || 'N/A'}</span>
                <span>Projected Sales: {item.projected_sales || 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400">No products data available</p>
      )}
    </motion.div>
  );
};

const ImportForecast = () => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState(null);

  const API_URL = 'http://127.0.0.1:8000/api/inventory-forecast/';

  const handleUpload = async () => {
    if (!file) return setError('Please select a file');
    
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      // First, upload to inventory-forecast endpoint
      const forecastResponse = await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      });

      const forecastData = forecastResponse.data;

      // Initialize chatbot context with the uploaded data
      await axios.post('http://127.0.0.1:8000/api/chatbot/', {
        contents: [{ parts: [{ text: 'Initialize context with uploaded inventory data' }] }],
        uploaded_data: forecastData
      });

      if (!forecastData?.forecast || !Array.isArray(forecastData.forecast)) {
        throw new Error('Invalid data format from server');
      }

      setForecastData({
        forecast: forecastData.forecast.map(item => ({
          product: item.product_name,
          predicted_sales: item.predicted_sales,
          confidence: item.confidence_score
        })),
        analytics: {
          inventory_health: forecastData.inventory_analysis || {},
          fast_moving: forecastData.fast_moving_products || [],
          slow_moving: forecastData.slow_moving_products || []
        }
      });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <MainLayout>
        <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
          {/* Upload Section */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <FaFileImport className="text-3xl text-amber-500" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                  Inventory Forecast
                </h1>
                <p className="text-gray-400 mt-2">
                  AI-powered inventory predictions and analytics
                </p>
              </div>
            </div>

            {/* File Upload Card */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 mb-8">
              <div className="text-center">
                <FiUploadCloud className="text-4xl text-amber-500 mx-auto mb-4" />
                <input
                  type="file"
                  id="fileInput"
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  accept=".csv,.xlsx,.xls"
                />
                <label
                  htmlFor="fileInput"
                  className="inline-block px-6 py-3 bg-amber-500/20 text-amber-500 rounded-lg cursor-pointer hover:bg-amber-500/30 transition-colors"
                >
                  {file ? file.name : 'Choose File'}
                </label>
                {error && <p className="text-red-400 mt-3">{error}</p>}
              </div>
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleUpload}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <FaSpinner className="animate-spin" />
                  Analyzing...
                </span>
              ) : 'Generate Forecast'}
            </button>
          </div>

          {/* Analysis Results */}
          <AnimatePresence>
            {forecastData && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-6xl mx-auto space-y-8"
              >
                {/* Key Metrics Summary */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-amber-500/10 rounded-xl">
                    <p className="text-sm text-amber-400">Total Predicted Sales</p>
                    <p className="text-2xl font-bold text-amber-500">
                      ${forecastData.forecast
                        .reduce((sum, item) => sum + (item.predicted_sales || 0), 0)
                        .toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-xl">
                    <p className="text-sm text-green-400">Average Confidence</p>
                    <p className="text-2xl font-bold text-green-500">
                      {Math.round(
                        forecastData.forecast.reduce((sum, item) => sum + (item.confidence || 0), 0) /
                        forecastData.forecast.length
                      )}%
                    </p>
                  </div>
                  <div className="p-4 bg-purple-500/10 rounded-xl">
                    <p className="text-sm text-purple-400">Products Analyzed</p>
                    <p className="text-2xl font-bold text-purple-500">
                      {forecastData.forecast.length}
                    </p>
                  </div>
                </div>

                {/* Main Visualization */}
                <div className="grid lg:grid-cols-2 gap-8">
                  <ForecastChart data={forecastData.forecast} />
                  <InventoryHealth health={forecastData.analytics.inventory_health} />
                </div>

                {/* Product Movement */}
                <div className="grid lg:grid-cols-2 gap-8">
                  <ProductList
                    title="🚀 Fast Moving Products"
                    items={forecastData.analytics.fast_moving}
                    type="fast"
                  />
                  <ProductList
                    title="⚠️ Slow Moving Products"
                    items={forecastData.analytics.slow_moving}
                    type="slow"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </MainLayout>
    </ErrorBoundary>
  );
};

export default ImportForecast;
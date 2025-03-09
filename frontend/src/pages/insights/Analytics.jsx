import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell,
  BarChart, Bar, ResponsiveContainer
} from 'recharts';
import {
  DollarSign, ShoppingCart, Package, Lightbulb, AlertTriangle, Zap
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import ErrorBoundary from '../../components/ErrorBoundary';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch analytics data from backend
  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/analytics/');
      setAnalyticsData(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to fetch analytics data');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  if (loading) {
    return (
      <ErrorBoundary>
        <MainLayout>
          <div className="flex items-center justify-center flex-1 bg-gradient-to-br from-blue-100 via-gray-200 to-white">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ rotate: 360, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <Zap className="h-16 w-16 text-purple-500 animate-pulse" />
            </motion.div>
          </div>
        </MainLayout>
      </ErrorBoundary>
    );
  }

  if (error || !analyticsData) {
    return (
      <ErrorBoundary>
        <MainLayout>
          <div className="flex flex-col items-center justify-center flex-1 bg-blue-100 text-gray-900">
            <AlertTriangle className="h-20 w-20 text-red-500 mb-4" />
            <h2 className="text-3xl font-bold mb-4">{error || 'No data available'}</h2>
            <button
              onClick={fetchAnalyticsData}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl font-semibold transition-transform transform hover:scale-105"
            >
              Refresh Dashboard
            </button>
          </div>
        </MainLayout>
      </ErrorBoundary>
    );
  }

  // Destructure analytics data
  const { KPIs, monthlySalesTrend, salesByCategory, inventoryHealth, recentOrders, stockAlerts } = analyticsData;

  // Prepare numeric data for inventory chart
  const inventoryData = {
    totalProductsInStock: inventoryHealth.totalProductsInStock,
    lowStockItems: Array.isArray(inventoryHealth.lowStockItems)
      ? inventoryHealth.lowStockItems.length
      : inventoryHealth.lowStockItems,
    outOfStockItems: Array.isArray(inventoryHealth.outOfStockItems)
      ? inventoryHealth.outOfStockItems.length
      : inventoryHealth.outOfStockItems,
  };

  return (
    <ErrorBoundary>
      <MainLayout>
        <motion.div
          className="flex-1 bg-blue-100 text-gray-900"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="max-w-7xl mx-auto p-8">
            {/* Header */}
            <motion.div variants={fadeInUp} className="flex flex-col md:flex-row justify-between items-center mb-12">
              <div>
                <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  Business Intelligence Dashboard
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Real-time analytics powered by AI
                </p>
              </div>
              <button
                onClick={fetchAnalyticsData}
                className="mt-4 md:mt-0 px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 rounded-xl font-semibold transition-transform transform hover:scale-105"
              >
                Refresh Data
              </button>
            </motion.div>

            {/* KPI Cards */}
            <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
              {[
                { title: 'Total Revenue', value: `₹${KPIs.totalRevenue.toLocaleString()}` },
                { title: 'Average Order Value', value: `₹${KPIs.averageOrderValue}` },
                { title: 'Total Orders', value: KPIs.totalOrders },
                { title: 'Total Products', value: KPIs.totalProducts },
                { title: 'Total Inventory', value: KPIs.totalInventory },
              ].map((card, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)' }}
                  className="bg-gray-200 p-6 rounded-xl shadow-lg transition-shadow"
                >
                  <h3 className="text-xl font-semibold">{card.title}</h3>
                  <p className="mt-2 text-3xl font-bold">{card.value}</p>
                </motion.div>
              ))}
              {/* Top Categories Card */}
              <motion.div
                variants={fadeInUp}
                whileHover={{ scale: 1.05, boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)' }}
                className="bg-gray-200 p-6 rounded-xl shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold">Top Categories</h3>
                <ul className="mt-2 space-y-1">
                  {KPIs.topCategories.map((cat, index) => (
                    <li key={index} className="text-lg">
                      {cat.category}: {cat.totalSold}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>

            {/* Monthly Sales Trend - Line Chart */}
            <motion.div variants={fadeInUp} className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Monthly Sales Trend</h2>
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlySalesTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#000" />
                    <XAxis dataKey="month" stroke="#000" />
                    <YAxis stroke="#000" />
                    <Tooltip contentStyle={{ backgroundColor: '#f3f4f6', border: 'none', color: '#111827' }} />
                    <Line type="monotone" dataKey="totalSales" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 5, fill: '#7C3AED' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Sales by Category - Pie Chart */}
            <motion.div variants={fadeInUp} className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Sales by Category</h2>
              <div className="w-full h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={salesByCategory} dataKey="sales" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={({ name }) => name}>
                      {salesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 70}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Inventory Health - Bar Chart */}
            <motion.div variants={fadeInUp} className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Inventory Health</h2>
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[inventoryData]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="totalProductsInStock" hide />
                    <YAxis stroke="#ccc" />
                    <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }} />
                    <Bar dataKey="totalProductsInStock" fill="#10B981" name="Products In Stock" />
                    <Bar dataKey="lowStockItems" fill="#F59E0B" name="Low Stock" />
                    <Bar dataKey="outOfStockItems" fill="#EF4444" name="Out of Stock" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Recent Orders Table */}
            <motion.div variants={fadeInUp} className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Recent Orders</h2>
              {recentOrders && recentOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-300">
                      <tr>
                        <th className="py-3 px-4 text-left">Order #</th>
                        <th className="py-3 px-4 text-left">Customer</th>
                        <th className="py-3 px-4 text-left">Total Amount</th>
                        <th className="py-3 px-4 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order, index) => (
                        <tr key={index} className="border-t border-gray-400">
                          <td className="py-3 px-4">#{order.orderNumber}</td>
                          <td className="py-3 px-4">{order.customerName}</td>
                          <td className="py-3 px-4">{order.totalAmount}</td>
                          <td className="py-3 px-4">{order.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-lg">No recent orders available.</p>
              )}
            </motion.div>

            {/* Stock Alerts */}
            <motion.div variants={fadeInUp} className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Stock Alerts</h2>
              {stockAlerts && stockAlerts.length > 0 ? (
                <ul className="bg-gray-200 rounded-xl p-6 space-y-3">
                  {stockAlerts.map((alert, index) => (
                    <li key={index} className="text-lg">
                      <strong>{alert.product}</strong>: {alert.message}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-lg">No stock alerts.</p>
              )}
            </motion.div>
          </div>
        </motion.div>
      </MainLayout>
    </ErrorBoundary>
  );
};

export default Analytics;
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, Legend,
  Area, AreaChart
} from 'recharts';
import {
  DollarSign, ShoppingCart, Package, AlertTriangle, Zap, RefreshCw,
  TrendingUp, Users, Box, Activity
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      duration: 0.3,
      ease: 'easeOut'
    } 
  }
};

const cardHover = {
  hover: {
    y: -5,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    transition: { type: 'spring', stiffness: 300 }
  }
};

const Analytics = () => {
  // ... [Keep existing state and data fetching logic] ...

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <motion.div className="flex flex-col md:flex-row justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Enterprise Analytics Suite
            </h1>
            <p className="mt-2 text-lg text-gray-400">
              Real-time business intelligence powered by AI
            </p>
          </div>
          <motion.button
            onClick={fetchAnalyticsData}
            className="mt-4 md:mt-0 px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-semibold 
              backdrop-blur-sm border border-cyan-500/30 hover:border-cyan-400/50 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent">
              Refresh Insights
            </span>
          </motion.button>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { 
              title: 'Total Revenue', 
              value: `₹${KPIs.totalRevenue.toLocaleString()}`,
              icon: DollarSign,
              color: 'from-blue-400 to-cyan-400'
            },
            { 
              title: 'Avg. Order Value', 
              value: `₹${KPIs.averageOrderValue}`,
              icon: TrendingUp,
              color: 'from-purple-400 to-fuchsia-400'
            },
            { 
              title: 'Total Orders', 
              value: KPIs.totalOrders,
              icon: ShoppingCart,
              color: 'from-orange-400 to-amber-400'
            },
            { 
              title: 'Total Products', 
              value: KPIs.totalProducts,
              icon: Box,
              color: 'from-green-400 to-emerald-400'
            },
          ].map((card, index) => (
            <motion.div
              key={index}
              variants={cardHover}
              whileHover="hover"
              className="bg-gray-800/30 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 
                shadow-2xl hover:shadow-3xl transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${card.color}`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm text-gray-400">Last 30 days</span>
              </div>
              <h3 className="text-lg font-medium text-gray-300">{card.title}</h3>
              <p className="mt-2 text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent 
                from-white to-gray-300">
                {card.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Enhanced Sales Trend Chart */}
        <motion.div 
          className="bg-gray-800/20 p-6 rounded-3xl border border-gray-700/50 backdrop-blur-lg shadow-2xl"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Revenue Performance</h2>
              <p className="text-gray-400">Monthly sales trend analysis</p>
            </div>
            <div className="flex space-x-2">
              <div className="flex items-center px-4 py-2 bg-gray-800/50 rounded-lg">
                <span className="text-cyan-400">↑ 12.4%</span>
                <span className="text-gray-400 ml-2">vs previous month</span>
              </div>
            </div>
          </div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySalesTrend}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#A0AEC0' }}
                  axisLine={{ stroke: '#4A5568' }}
                />
                <YAxis 
                  tick={{ fill: '#A0AEC0' }}
                  axisLine={{ stroke: '#4A5568' }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(26, 32, 44, 0.95)',
                    border: '1px solid #2D3748',
                    borderRadius: '8px',
                    backdropFilter: 'blur(4px)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="totalSales"
                  stroke="#38BDF8"
                  strokeWidth={2.5}
                  fill="url(#salesGradient)"
                  dot={{
                    r: 4,
                    fill: '#38BDF8',
                    stroke: '#0F172A',
                    strokeWidth: 2
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Enhanced Category Distribution */}
        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div 
            className="bg-gray-800/20 p-6 rounded-3xl border border-gray-700/50 backdrop-blur-lg shadow-2xl"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Category Distribution</h2>
              <p className="text-gray-400">Sales breakdown by product category</p>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesByCategory}
                    innerRadius="60%"
                    outerRadius="85%"
                    paddingAngle={2}
                    dataKey="sales"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {salesByCategory.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={`hsl(${index * 60}, 70%, 50%)`}
                        stroke="#0F172A"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span className="text-gray-300">{value}</span>}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(26, 32, 44, 0.95)',
                      border: '1px solid #2D3748',
                      borderRadius: '8px',
                      backdropFilter: 'blur(4px)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Inventory Health */}
          <motion.div 
            className="bg-gray-800/20 p-6 rounded-3xl border border-gray-700/50 backdrop-blur-lg shadow-2xl"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Inventory Health</h2>
              <p className="text-gray-400">Real-time stock status monitoring</p>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[inventoryData]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                  <Bar 
                    dataKey="totalProductsInStock" 
                    fill="#38BDF8"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="lowStockItems" 
                    fill="#FBBF24"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="outOfStockItems" 
                    fill="#F87171"
                    radius={[4, 4, 0, 0]}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span className="text-gray-300">{value}</span>}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(26, 32, 44, 0.95)',
                      border: '1px solid #2D3748',
                      borderRadius: '8px',
                      backdropFilter: 'blur(4px)'
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Recent Orders Table */}
        <motion.div
          className="bg-gray-800/20 p-6 rounded-3xl border border-gray-700/50 backdrop-blur-lg shadow-2xl"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Recent Transactions</h2>
            <p className="text-gray-400">Latest customer orders and activities</p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-700/50">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Order ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {recentOrders.map((order, index) => (
                  <tr key={index} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 text-blue-400 font-medium">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-gray-300">{order.customerName}</td>
                    <td className="px-6 py-4 text-emerald-400">₹{order.totalAmount}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                        Completed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Analytics;
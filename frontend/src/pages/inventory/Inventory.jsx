import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import ErrorBoundary from "../../components/ErrorBoundary";
import MainLayout from "../../components/layout/MainLayout";

// Helper function to extract array data from API response
const extractData = (response) => {
  return Array.isArray(response) ? response : response.data || [];
};

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [bgGradient, setBgGradient] = useState(
    "bg-gradient-to-b from-blue-100 to-gray-100"
  );
  const [categorySales, setCategorySales] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const baseUrl = process.env.NODE_ENV === 'production' ? window.location.origin : API_BASE_URL;
        const endpoints = [
          `${baseUrl}/api/inventory/`,
          `${baseUrl}/api/product/`,
          `${baseUrl}/api/order/`,
        ];

        const responses = await Promise.all(
          endpoints.map((endpoint) =>
            fetch(endpoint).then((res) => {
              if (!res.ok)
                throw new Error(`Failed to fetch ${endpoint}`);
              return res.json();
            })
          )
        );

        const [invRes, prodRes, orderRes] = responses;

        const inventoryData = extractData(invRes);
        const productsData = extractData(prodRes);
        const ordersData = extractData(orderRes);

        console.log({
          inventory: inventoryData,
          products: productsData,
          orders: ordersData,
        });

        setInventory(inventoryData);
        setProducts(productsData);
        setOrders(ordersData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    switch (filter) {
      case "sale":
        setBgGradient("bg-gradient-to-b from-red-100 to-gray-100");
        break;
      case "restock":
        setBgGradient("bg-gradient-to-b from-green-100 to-gray-100");
        break;
      default:
        setBgGradient("bg-gradient-to-b from-blue-100 to-gray-100");
        break;
    }
  }, [filter]);

  useEffect(() => {
    if (products.length > 0 && orders.length > 0) {
      const productMap = products.reduce((acc, product) => {
        acc[product.id] = product;
        return acc;
      }, {});

      const salesSummary = orders.reduce((acc, order) => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item) => {
            const product = productMap[item.product];
            if (product) {
              const category = product.category;
              if (!acc[category]) {
                acc[category] = 0;
              }
              acc[category] += item.quantity;
            }
          });
        }
        return acc;
      }, {});

      setCategorySales(salesSummary);
    }
  }, [products, orders]);

  // Filter transactions ensuring product exists
  const salesData = inventory.filter(
    (item) => item.transaction_type === "sale" && item.product
  );
  const restockData = inventory.filter(
    (item) => item.transaction_type === "restock" && item.product
  );

  // Aggregate data per product name using optional chaining
  const aggregatedSales = salesData.map((item) => ({
    name: item.product?.name || "Unknown",
    sales: item.quantity,
  }));
  const aggregatedRestocks = restockData.map((item) => ({
    name: item.product?.name || "Unknown",
    restock: item.quantity,
  }));

  // Merge aggregated data into one dataset for the "all" filter
  const mergedDataMap = {};
  aggregatedSales.forEach((sale) => {
    mergedDataMap[sale.name] = { name: sale.name, sales: sale.sales, restock: 0 };
  });
  aggregatedRestocks.forEach((restock) => {
    if (mergedDataMap[restock.name]) {
      mergedDataMap[restock.name].restock = restock.restock;
    } else {
      mergedDataMap[restock.name] = { name: restock.name, sales: 0, restock: restock.restock };
    }
  });
  const mergedData = Object.values(mergedDataMap);

  // Filter merged data by search term
  const filteredMergedData = mergedData.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Limit transaction lists for individual filters to 5 items
  const displayedSales = salesData.slice(0, 5);
  const displayedRestocks = restockData.slice(0, 5);

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    hover: { scale: 1.02, transition: { duration: 0.2 } },
  };

  const chartVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
    hover: {
      scale: 1.02,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.2 },
    },
  };

  // Custom tooltip for the charts with enhanced styling and animations
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-100 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-300"
        >
          <p className="text-yellow-400 font-semibold text-lg mb-2">{label}</p>
          {payload.map((entry) => (
            <motion.p
              key={entry.dataKey}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className={`text-${entry.dataKey === "sales" ? "red" : "green"}-300 font-medium`}
            >
              {entry.dataKey === "sales" ? "📉 Sales" : "📈 Restock"}: {entry.value} units
            </motion.p>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  return (
    <ErrorBoundary>
      <MainLayout>
        <div className={`flex-1 p-8 text-black ${bgGradient}`}>
        <motion.div 
          className="max-w-7xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1
            className="text-5xl font-extrabold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            📦 StockPilot Inventory Dashboard
          </motion.h1>
          <motion.p 
            className="text-lg text-center text-gray-600 mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Real-time insights into your inventory management
          </motion.p>

          <motion.div 
            className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gray-100 p-4 rounded-xl border border-gray-300 shadow-lg"
            whileHover={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setFilter("all")}
                className={`px-6 py-2.5 rounded-lg font-medium ${
                  filter === "all" 
                    ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 shadow-lg shadow-yellow-500/30" 
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                } transition-all duration-300 transform hover:scale-105`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("sale")}
                className={`px-6 py-2.5 rounded-lg font-medium ${
                  filter === "sale" 
                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30" 
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                } transition-all duration-300 transform hover:scale-105`}
              >
                Sales
              </button>
              <button
                onClick={() => setFilter("restock")}
                className={`px-6 py-2.5 rounded-lg font-medium ${
                  filter === "restock" 
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30" 
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                } transition-all duration-300 transform hover:scale-105`}
              >
                Restock
              </button>
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-6 py-2.5 rounded-lg bg-gray-200 text-black border border-gray-300 backdrop-blur-sm focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all duration-300 w-full md:w-auto placeholder-gray-400 hover:bg-gray-300"
            />
          </motion.div>

          <AnimatePresence>
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center p-8 rounded-xl bg-gray-200 border border-gray-300"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block mb-4 text-4xl"
                >
                  📊
                </motion.div>
                <p className="text-xl font-medium text-yellow-400 mb-2">
                  Loading your dashboard...
                </p>
                <p className="text-gray-600">
                  Fetching the latest inventory data
                </p>
              </motion.div>
            ) : (
              <>
                {filter === "sale" && (
                  <motion.div
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="mb-10"
                  >
                    <h2 className="text-2xl font-semibold mb-4 text-red-300 border-b-2 border-red-600 pb-2">
                      🔥 Sales Transactions
                    </h2>
                    <ul className="space-y-3 text-lg">
                      {displayedSales.map((item) => (
                        <li
                          key={item.id}
                          className="border-b py-3 flex justify-between items-center bg-gray-100 rounded-lg p-2 hover:bg-gray-200 transition"
                        >
                          <span className="font-medium">
                            {item.product?.name || "Unknown"}
                          </span>
                          <span className="text-sm">
                            {item.quantity} units - ₹{item.transaction_cost}
                          </span>
                        </li>
                      ))}
                      {salesData.length > 5 && (
                        <li className="text-center text-gray-400 mt-2">
                          And {salesData.length - 5} more transactions...
                        </li>
                      )}
                    </ul>
                    <motion.div
                      variants={chartVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="bg-gray-100 p-6 rounded-xl shadow-lg mt-10"
                      whileHover={{ scale: 1.02 }}
                    >
                      <h2 className="text-2xl font-semibold mb-4 text-center text-red-300">
                        📈 Sales Overview
                      </h2>
                      <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={aggregatedSales}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                          <XAxis dataKey="name" stroke="#999" />
                          <YAxis stroke="#999" />
                          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "red", strokeWidth: 2 }} />
                          <Line
                            type="monotone"
                            dataKey="sales"
                            stroke="#FF5733"
                            strokeWidth={3}
                            dot={{
                              r: 6,
                              fill: "#FF5733",
                              strokeWidth: 2,
                              stroke: "#fff",
                            }}
                            activeDot={{
                              r: 8,
                              fill: "#FF5733",
                              stroke: "#fff",
                              strokeWidth: 2,
                              onMouseOver: (e) => {
                                e.target.style.cursor = "pointer";
                              },
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </motion.div>
                  </motion.div>
                )}

                {filter === "restock" && (
                  <motion.div
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="mb-10"
                  >
                    <h2 className="text-2xl font-semibold mb-4 text-green-300 border-b-2 border-green-600 pb-2">
                      📦 Restock Transactions
                    </h2>
                    <ul className="space-y-3 text-lg">
                      {displayedRestocks.map((item) => (
                        <li
                          key={item.id}
                          className="border-b py-3 flex justify-between items-center bg-gray-100 rounded-lg p-2 hover:bg-gray-200 transition"
                        >
                          <span className="font-medium">
                            {item.product?.name || "Unknown"}
                          </span>
                          <span className="text-sm">
                            {item.quantity} units - ₹{item.transaction_cost}
                          </span>
                        </li>
                      ))}
                      {restockData.length > 5 && (
                        <li className="text-center text-gray-400 mt-2">
                          And {restockData.length - 5} more transactions...
                        </li>
                      )}
                    </ul>
                    <motion.div
                      variants={chartVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="bg-gray-100 p-6 rounded-xl shadow-lg mt-10"
                      whileHover={{ scale: 1.02 }}
                    >
                      <h2 className="text-2xl font-semibold mb-4 text-center text-green-300">
                        📊 Restock Overview
                      </h2>
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={aggregatedRestocks} barSize={45}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                          <XAxis dataKey="name" stroke="#999" />
                          <YAxis stroke="#999" />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0, 0, 0, 0.1)" }} />
                          <Bar
                            dataKey="restock"
                            fill="#4CAF50"
                            animationDuration={1000}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </motion.div>
                  </motion.div>
                )}

                {filter === "all" && (
                  <motion.div
                    variants={chartVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="bg-gray-100 p-6 rounded-2xl border border-gray-300 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                  >
                    <h2 className="text-2xl font-semibold mb-4 text-center text-yellow-400">
                      📊 Combined Overview
                    </h2>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={filteredMergedData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                        <XAxis dataKey="name" stroke="#999" />
                        <YAxis stroke="#999" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: "#ccc" }} />
                        <Bar
                          dataKey="sales"
                          fill="#FF5733"
                          animationDuration={1000}
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="restock"
                          fill="#4CAF50"
                          animationDuration={1000}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="text-center text-gray-400 mt-4">
                      Each product shows two bars:{" "}
                      <span className="font-semibold text-red-300">Sales</span> (red) and{" "}
                      <span className="font-semibold text-green-300">Restock</span> (green).
                    </p>
                  </motion.div>
                )}

                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="bg-gray-100 p-6 rounded-2xl border border-gray-300 backdrop-blur-sm shadow-xl mt-10 hover:shadow-2xl transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                >
                  <h2 className="text-2xl font-semibold mb-4 text-center text-yellow-400">
                    📊 Sales by Category
                  </h2>
                  <ul className="space-y-3 text-lg">
                    {Object.entries(categorySales).map(([category, quantity]) => (
                      <li
                        key={category}
                        className="border-b py-3 flex justify-between items-center text-gray-600 bg-gray-100 rounded-lg p-4 hover:bg-gray-200 transition-all duration-300 transform hover:scale-102 hover:shadow-lg backdrop-blur-sm"
                      >
                        <span className="font-medium">{category}</span>
                        <span>{quantity} units</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
        </div>
      </MainLayout>
    </ErrorBoundary>
  );
};

export default Inventory;

import { useEffect, useState } from "react";
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
  Legend, // <-- Added Legend here
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import ErrorBoundary from "../../components/ErrorBoundary";

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
    "bg-gradient-to-b from-blue-900 to-gray-900"
  );
  const [categorySales, setCategorySales] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("http://localhost:8000/inventory/").then((res) => res.json()),
      fetch("http://localhost:8000/product/").then((res) => res.json()),
      fetch("http://localhost:8000/order/").then((res) => res.json()),
    ])
      .then(([invRes, prodRes, orderRes]) => {
        const inventoryData = extractData(invRes);
        const productsData = extractData(prodRes);
        const ordersData = extractData(orderRes);
        console.log("Inventory Data:", inventoryData);
        console.log("Products Data:", productsData);
        console.log("Orders Data:", ordersData);
        setInventory(inventoryData);
        setProducts(productsData);
        setOrders(ordersData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    switch (filter) {
      case "sale":
        setBgGradient("bg-gradient-to-b from-red-800 to-gray-900");
        break;
      case "restock":
        setBgGradient("bg-gradient-to-b from-green-800 to-gray-900");
        break;
      default:
        setBgGradient("bg-gradient-to-b from-blue-900 to-gray-900");
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
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const chartVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
  };

  // Custom tooltip for the charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-700 p-3 rounded-lg shadow-md">
          <p className="text-white font-semibold">{label}</p>
          {payload.map((entry) => (
            <p key={entry.dataKey} className="text-gray-300">
              {entry.dataKey === "sales" ? "Sales" : "Restock"}: {entry.value} units
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ErrorBoundary>
      <div className={`min-h-screen p-8 text-white ${bgGradient}`}>
        <motion.h1
          className="text-5xl font-extrabold mb-10 text-center text-yellow-400"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          📦 StockPilot Inventory Dashboard
        </motion.h1>

        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex space-x-4 mb-4 md:mb-0">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg ${
                filter === "all" ? "bg-yellow-400 text-gray-900" : "bg-gray-800"
              } hover:bg-yellow-500 transition-colors duration-300`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("sale")}
              className={`px-4 py-2 rounded-lg ${
                filter === "sale" ? "bg-red-500 text-white" : "bg-gray-800"
              } hover:bg-red-600 transition-colors duration-300`}
            >
              Sales
            </button>
            <button
              onClick={() => setFilter("restock")}
              className={`px-4 py-2 rounded-lg ${
                filter === "restock" ? "bg-green-500 text-white" : "bg-gray-800"
              } hover:bg-green-600 transition-colors duration-300`}
            >
              Restock
            </button>
          </div>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 rounded-md bg-gray-800 text-white border border-gray-700"
          />
        </div>

        <AnimatePresence>
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-gray-300 text-lg"
            >
              Loading data...
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
                        className="border-b py-3 flex justify-between items-center bg-gray-700 rounded-lg p-2 hover:bg-gray-600 transition"
                      >
                        <span className="font-medium">{item.product?.name || "Unknown"}</span>
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
                    className="bg-gray-800 p-6 rounded-xl shadow-lg mt-10"
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
                          dot={{ r: 6 }}
                          activeDot={{ r: 8 }}
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
                        className="border-b py-3 flex justify-between items-center bg-gray-700 rounded-lg p-2 hover:bg-gray-600 transition"
                      >
                        <span className="font-medium">{item.product?.name || "Unknown"}</span>
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
                    className="bg-gray-800 p-6 rounded-xl shadow-lg mt-10"
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
                        <Bar dataKey="restock" fill="#4CAF50" animationDuration={1000} />
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
                  className="bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition duration-300"
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
                      <Bar dataKey="sales" fill="#FF5733" animationDuration={1000} />
                      <Bar dataKey="restock" fill="#4CAF50" animationDuration={1000} />
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
                className="bg-gray-800 p-6 rounded-xl shadow-lg mt-10 hover:shadow-2xl transition duration-300"
                whileHover={{ scale: 1.02 }}
              >
                <h2 className="text-2xl font-semibold mb-4 text-center text-yellow-400">
                  📊 Sales by Category
                </h2>
                <ul className="space-y-3 text-lg">
                  {Object.entries(categorySales).map(([category, quantity]) => (
                    <li
                      key={category}
                      className="border-b py-3 flex justify-between items-center text-gray-300 bg-gray-700 rounded-lg p-2 hover:bg-gray-600 transition"
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
      </div>
    </ErrorBoundary>
  );
};

export default Inventory;

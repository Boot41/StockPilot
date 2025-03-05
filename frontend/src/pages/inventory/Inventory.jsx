import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

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

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("http://localhost:8000/inventory/").then((res) => res.json()),
      fetch("http://localhost:8000/product/").then((res) => res.json()),
      fetch("http://localhost:8000/order/").then((res) => res.json()),
    ])
      .then(([inventoryData, productsData, ordersData]) => {
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
        return acc;
      }, {});

      setCategorySales(salesSummary);
    }
  }, [products, orders]);

  const salesData = inventory.filter(
    (item) => item.transaction_type === "sale"
  );
  const restockData = inventory.filter(
    (item) => item.transaction_type === "restock"
  );

  const aggregatedSales = salesData.map((item) => ({
    name: item.product.name,
    sales: item.quantity,
  }));

  const aggregatedRestocks = restockData.map((item) => ({
    name: item.product.name,
    restock: item.quantity,
  }));

  // Limit transaction lists to 5 items for a cleaner display
  const displayedSales = salesData.slice(0, 5);
  const displayedRestocks = restockData.slice(0, 5);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const chartVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
  };

  return (
    <div className={`min-h-screen p-8 text-white ${bgGradient}`}>
      <motion.h1
        className="text-5xl font-extrabold mb-10 text-center text-yellow-400"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        📦 StockPilot Inventory
      </motion.h1>

      <div className="mb-6 flex justify-center space-x-4">
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

      <AnimatePresence>
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-gray-300 text-lg"
          >
            Loading...
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
                      className="border-b py-3 flex justify-between text-gray-300 bg-gray-700 rounded-lg p-2"
                    >
                      <span>{item.product.name}</span>
                      <span>
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
                >
                  <h2 className="text-2xl font-semibold mb-4 text-center text-red-300">
                    📈 Sales Overview
                  </h2>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={aggregatedSales}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                      <XAxis dataKey="name" stroke="#999" />
                      <YAxis stroke="#999" />
                      <Tooltip cursor={{ stroke: "red", strokeWidth: 2 }} />
                      <Legend wrapperStyle={{ color: "#999" }} />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="#FF5733"
                        strokeWidth={3}
                        dot={{ r: 6 }}
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
                      className="border-b py-3 flex justify-between text-gray-300 bg-gray-700 rounded-lg p-2"
                    >
                      <span>{item.product.name}</span>
                      <span>
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
                >
                  <h2 className="text-2xl font-semibold mb-4 text-center text-green-300">
                    📊 Restock Overview
                  </h2>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={aggregatedRestocks} barSize={45}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                      <XAxis dataKey="name" stroke="#999" />
                      <YAxis stroke="#999" />
                      <Tooltip cursor={{ fill: "rgba(0, 0, 0, 0.1)" }} />
                      <Legend wrapperStyle={{ color: "#999" }} />
                      <Bar dataKey="restock" fill="#4CAF50" animationDuration={1000} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              </motion.div>
            )}

            {filter === "all" && (
              <div className="grid md:grid-cols-2 gap-10">
                {/* Graph Section: Graph above the product lists */}
                <div className="md:col-span-2">
                  <motion.div
                    variants={chartVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="bg-gray-800 p-6 rounded-xl shadow-lg mb-10"
                  >
                    <h2 className="text-2xl font-semibold mb-4 text-center text-red-500">
                      📈 Sales Overview
                    </h2>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={aggregatedSales}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                        <XAxis dataKey="name" stroke="#999" />
                        <YAxis stroke="#999" />
                        <Tooltip cursor={{ stroke: "red", strokeWidth: 2 }} />
                        <Legend wrapperStyle={{ color: "#999" }} />
                        <Line
                          type="monotone"
                          dataKey="sales"
                          stroke="#FF5733"
                          strokeWidth={3}
                          dot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </motion.div>
                </div>

                {/* Sales Transactions */}
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition duration-300"
                  whileHover={{ scale: 1.02 }}
                >
                  <h2 className="text-2xl font-semibold mb-4 text-red-500">
                    🔥 Sales Transactions
                  </h2>
                  <ul className="space-y-3 text-lg">
                    {displayedSales.map((item) => (
                      <li
                        key={item.id}
                        className="border-b py-3 flex justify-between text-gray-300 bg-gray-700 rounded-lg p-2"
                      >
                        <span>{item.product.name}</span>
                        <span>
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
                </motion.div>

                {/* Restock Transactions */}
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition duration-300"
                  whileHover={{ scale: 1.02 }}
                >
                  <h2 className="text-2xl font-semibold mb-4 text-green-500">
                    📦 Restock Transactions
                  </h2>
                  <ul className="space-y-3 text-lg">
                    {displayedRestocks.map((item) => (
                      <li
                        key={item.id}
                        className="border-b py-3 flex justify-between text-gray-300 bg-gray-700 rounded-lg p-2"
                      >
                        <span>{item.product.name}</span>
                        <span>
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
                </motion.div>
              </div>
            )}

            {/* Category Sales Summary */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-gray-800 p-6 rounded-xl shadow-lg mt-10"
            >
              <h2 className="text-2xl font-semibold mb-4 text-center text-yellow-400">
                📊 Sales by Category (Summarized)
              </h2>
              <ul className="space-y-3 text-lg">
                {Object.entries(categorySales).map(([category, quantity]) => (
                  <li
                    key={category}
                    className="border-b py-3 flex justify-between text-gray-300 bg-gray-700 rounded-lg p-2"
                  >
                    <span>{category}</span>
                    <span>{quantity} units</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inventory;

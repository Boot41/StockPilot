import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  FaEdit, FaTrashAlt, FaBoxOpen, FaShoppingCart, 
  FaBell, FaSearch, FaPlus, FaFilter, FaChartLine, FaArrowLeft,
  FaCheck
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import ErrorBoundary from '../../components/ErrorBoundary';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:8000";

const UserInventoryPage = () => {
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [groupedProducts, setGroupedProducts] = useState({});
  const [orders, setOrders] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showOrderEditModal, setShowOrderEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    description: "",
    quantity_in_stock: 0,
    price: 0,
    threshold_level: 0,
    extra_charge_percent: 5,
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const navigate = useNavigate();

  // Fetch data on mount
  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchStockAlerts();
  }, []);

  // Group products by category whenever products change
  useEffect(() => {
    const grouped = products.reduce((acc, product) => {
      const category = product.category || "Uncategorized";
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {});
    setGroupedProducts(grouped);
  }, [products]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/product/`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/product/${productId}/`);
        fetchProducts(); // Refresh the product list
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const handleEditProduct = async (product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleUpdateProduct = async () => {
    try {
      await axios.put(`${API_BASE_URL}/api/product/${editingProduct.id}/`, editingProduct);
      fetchProducts(); // Refresh the product list
      setShowEditModal(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/order/`);
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/order/${orderId}/`);
        fetchOrders(); // Refresh the orders list
      } catch (error) {
        console.error("Error deleting order:", error);
      }
    }
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setShowOrderEditModal(true);
  };

  const handleUpdateOrder = async () => {
    try {
      await axios.put(`${API_BASE_URL}/api/order/${editingOrder.id}/`, editingOrder);
      fetchOrders(); // Refresh the orders list
      setShowOrderEditModal(false);
      setEditingOrder(null);
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      await axios.put(`${API_BASE_URL}/api/order/${orderId}/`, {
        status: 'completed'
      });
      fetchOrders(); // Refresh the orders list
    } catch (error) {
      console.error("Error completing order:", error);
    }
  };

  const fetchStockAlerts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/stock-alert/`);
      setStockAlerts(response.data);
    } catch (error) {
      console.error("Error fetching stock alerts:", error);
    }
  };

  const handleAddProduct = async () => {
    try {
      await axios.post(`${API_BASE_URL}/product/`, newProduct);
      fetchProducts();
      setNewProduct({
        name: "",
        category: "",
        description: "",
        quantity_in_stock: 0,
        price: 0,
        threshold_level: 0,
        extra_charge_percent: 5,
      });
      setShowAddProduct(false);
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  // Filter products based on search term and category
  const filteredGroupedProducts = Object.entries(groupedProducts)
    .filter(([category]) => (filterCategory === "all" ? true : category === filterCategory))
    .map(([category, items]) => {
      const filteredItems = items.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return [category, filteredItems];
    })
    .filter(([_, items]) => items.length > 0);

  const productCategories = ["all", ...Object.keys(groupedProducts)];

  const inventoryChartData = Object.entries(groupedProducts).map(([category, items]) => ({
    name: category,
    count: items.length,
    stock: items.reduce((sum, item) => sum + item.quantity_in_stock, 0)
  }));

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 text-gray-900">
        {/* Header Section */}
        <header className="bg-gray-200 border-b border-gray-300 p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-300 rounded-full">
              <FaArrowLeft className="text-gray-700" />
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              StockPilot Pro
            </h1>
            <div className="flex space-x-6">
              <div className="flex items-center space-x-2 bg-gray-300 px-4 py-2 rounded-lg">
                <FaBoxOpen className="text-blue-400" />
                <span>{products.length} Products</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-300 px-4 py-2 rounded-lg">
                <FaShoppingCart className="text-green-400" />
                <span>{orders.length} Orders</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-300 px-4 py-2 rounded-lg">
                <FaBell className="text-red-400" />
                <span>{stockAlerts.length} Alerts</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Navigation Sidebar */}
          <nav className="w-64 bg-gray-200 border-r border-gray-300 p-4 space-y-2">
            <button
              onClick={() => setActiveTab("products")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === "products" ? "bg-blue-500/20 text-blue-400" : "hover:bg-gray-300"
              }`}
            >
              <FaBoxOpen />
              <span>Product Catalog</span>
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === "orders" ? "bg-green-500/20 text-green-400" : "hover:bg-gray-300"
              }`}
            >
              <FaShoppingCart />
              <span>Order Management</span>
            </button>
            <button
              onClick={() => setActiveTab("stockAlerts")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === "stockAlerts" ? "bg-red-500/20 text-red-400" : "hover:bg-gray-300"
              }`}
            >
              <FaBell />
              <span>Stock Alerts</span>
            </button>
          </nav>

          {/* Main Content Area */}
          <main className="flex-1 p-6 overflow-y-auto">
            {activeTab === "products" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Products Header */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold mb-4 sm:mb-0">Product Management</h2>
                  <button
                    onClick={() => setShowAddProduct(!showAddProduct)}
                    className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <FaPlus />
                    <span>Add Product</span>
                  </button>
                </div>

                {/* Add Product Form */}
                <AnimatePresence>
                  {showAddProduct && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-gray-200 p-6 rounded-xl mb-8 border border-gray-300"
                    >
                      <h3 className="text-xl font-semibold mb-4">New Product Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(newProduct).map(([key, value]) => (
                          <div key={key}>
                            <label className="block text-sm mb-2 capitalize">
                              {key.replace(/_/g, ' ')}
                            </label>
                            <input
                              type={typeof value === 'number' ? 'number' : 'text'}
                              name={key}
                              value={value}
                              onChange={(e) =>
                                setNewProduct({ ...newProduct, [key]: e.target.value })
                              }
                              className="w-full bg-gray-300 border border-gray-400 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end space-x-4 mt-6">
                        <button
                          onClick={() => setShowAddProduct(false)}
                          className="px-6 py-2 rounded-lg border border-gray-400 hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddProduct}
                          className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-lg transition-colors"
                        >
                          Create Product
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Edit Product Modal */}
                <AnimatePresence>
                  {showEditModal && editingProduct && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                    >
                      <div className="bg-gray-200 p-6 rounded-xl w-full max-w-2xl mx-4">
                        <h3 className="text-xl font-semibold mb-4">Edit Product</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {Object.entries(editingProduct).map(([key, value]) => {
                            // Skip id field and only show editable fields
                            if (key === 'id') return null;
                            return (
                              <div key={key}>
                                <label className="block text-sm mb-2 capitalize">
                                  {key.replace(/_/g, ' ')}
                                </label>
                                <input
                                  type={typeof value === 'number' ? 'number' : 'text'}
                                  value={value}
                                  onChange={(e) =>
                                    setEditingProduct({
                                      ...editingProduct,
                                      [key]: e.target.type === 'number' ? Number(e.target.value) : e.target.value,
                                    })
                                  }
                                  className="w-full bg-gray-300 border border-gray-400 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-end space-x-4 mt-6">
                          <button
                            onClick={() => {
                              setShowEditModal(false);
                              setEditingProduct(null);
                            }}
                            className="px-6 py-2 rounded-lg border border-gray-400 hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleUpdateProduct}
                            className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-lg text-white transition-colors"
                          >
                            Update Product
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Inventory Overview Chart */}
                <div className="bg-gray-200 p-6 rounded-xl mb-8 border border-gray-300">
                  <h3 className="text-xl font-semibold mb-4">Inventory Overview</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={inventoryChartData}>
                        <XAxis dataKey="name" stroke="#4b5563" />
                        <YAxis stroke="#4b5563" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#f3f4f6', border: 'none' }}
                          itemStyle={{ color: '#111827' }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="stock" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                  <div className="flex items-center space-x-2 bg-gray-200 px-4 py-2 rounded-lg">
                    <FaFilter className="text-purple-400" />
                    <select 
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="bg-transparent outline-none"
                    >
                      {productCategories.map(category => (
                        <option key={category} value={category} className="bg-gray-200">
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-300 border border-gray-400 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <FaSearch className="absolute left-3 top-3 text-gray-600" />
                    </div>
                  </div>
                </div>

                {/* Grouped Products */}
                {filteredGroupedProducts.map(([category, items]) => (
                  <div key={category} className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">{category} ({items.length})</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map(product => (
                        <motion.div
                          key={product.id}
                          whileHover={{ y: -4 }}
                          className="bg-gray-300 border border-gray-400 rounded-xl p-4"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="text-lg font-medium">{product.name}</h4>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleEditProduct(product)}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <FaEdit />
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <FaTrashAlt />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Stock: {product.quantity_in_stock}</p>
                            <p>Price: ₹{product.price}</p>
                            <p>Threshold: {product.threshold_level}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold">Order Management</h2>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search orders..."
                        className="bg-gray-300 border border-gray-400 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <FaSearch className="absolute left-3 top-3 text-gray-600" />
                    </div>
                  </div>
                </div>

                <div className="border border-gray-400 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-300">
                      <tr>
                        <th className="px-6 py-4 text-left">Order ID</th>
                        <th className="px-6 py-4 text-left">Items</th>
                        <th className="px-6 py-4 text-left">Status</th>
                        <th className="px-6 py-4 text-left">Total</th>
                        <th className="px-6 py-4 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id} className="border-t border-gray-400 hover:bg-gray-300/20">
                          <td className="px-6 py-4">#{order.id}</td>
                          <td className="px-6 py-4">
                            {order.items && order.items.map(item => (
                              <div key={item.id} className="flex items-center space-x-2">
                                <span>{item.product_name}</span>
                                <span className="text-gray-600">x{item.quantity}</span>
                              </div>
                            ))}
                          </td>
                          <td className="px-6 py-4">
                            <span 
                              className={`px-3 py-1 rounded-full text-sm ${order.status === 'completed' 
                                ? 'bg-green-500/20 text-green-500'
                                : order.status === 'shipped'
                                ? 'bg-blue-500/20 text-blue-500'
                                : 'bg-yellow-500/20 text-yellow-600'
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">₹{order.total_amount}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              {order.status === 'completed' && (
                                <button 
                                  className="text-green-500 hover:text-green-400 text-xl"
                                  title="Completed Order"
                                  disabled
                                >
                                  <FaCheck />
                                </button>
                              )}
                              
                              {order.status === 'shipped' && (
                                <>
                                  <button 
                                    onClick={() => handleCompleteOrder(order.id)}
                                    className="text-green-500 hover:text-green-400 text-xl"
                                    title="Mark as Completed"
                                  >
                                    <FaCheck />
                                  </button>
                                  <button 
                                    onClick={() => handleEditOrder(order)}
                                    className="text-blue-500 hover:text-blue-400 text-xl"
                                    title="Edit Order"
                                  >
                                    <FaEdit />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteOrder(order.id)}
                                    className="text-red-500 hover:text-red-400 text-xl"
                                    title="Delete Order"
                                  >
                                    <FaTrashAlt />
                                  </button>
                                </>
                              )}
                              
                              {order.status === 'pending' && (
                                <button 
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="text-red-500 hover:text-red-400 text-xl"
                                  title="Delete Order"
                                >
                                  <FaTrashAlt />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Edit Order Modal */}
                <AnimatePresence>
                  {showOrderEditModal && editingOrder && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                    >
                      <div className="bg-gray-200 p-6 rounded-xl w-full max-w-2xl mx-4">
                        <h3 className="text-xl font-semibold mb-4">Edit Order</h3>
                        <div className="grid grid-cols-1 gap-4">
                          {/* Only show editable fields */}
                          <div>
                            <label className="block text-sm mb-2">Status</label>
                            <select
                              value={editingOrder.status}
                              onChange={(e) =>
                                setEditingOrder({
                                  ...editingOrder,
                                  status: e.target.value,
                                })
                              }
                              className="w-full bg-gray-300 border border-gray-400 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value="pending">Pending</option>
                              <option value="shipped">Shipped</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-4 mt-6">
                          <button
                            onClick={() => {
                              setShowOrderEditModal(false);
                              setEditingOrder(null);
                            }}
                            className="px-6 py-2 rounded-lg border border-gray-400 hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleUpdateOrder}
                            className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-lg text-white transition-colors"
                          >
                            Update Order
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Stock Alerts Tab */}
            {activeTab === "stockAlerts" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold">Stock Alerts</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stockAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-lg font-medium">{alert.product_name}</h4>
                        <p className="text-red-400">Current Stock: {alert.stock_level}</p>
                      </div>
                      <FaBell className="text-red-400 text-xl" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default UserInventoryPage;

import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaTrashAlt, FaBoxOpen, FaShoppingCart, FaBell, FaSearch, FaPlus } from "react-icons/fa";
import { motion } from "framer-motion";
import ErrorBoundary from '../../components/ErrorBoundary'; // Correct path

const API_BASE_URL = "http://localhost:8000";

const UserInventoryPage = () => {
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    description: "",
    quantity_in_stock: 0,
    price: 0,
    threshold_level: 0,
    extra_charge_percent: 5,
  });

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchStockAlerts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/product/`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/order/`);
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchStockAlerts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stock-alert/`);
      setStockAlerts(response.data);
    } catch (error) {
      console.error("Error fetching stock alerts:", error);
    }
  };

  const handleEdit = (id) => {
    alert(`Edit product with ID: ${id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`${API_BASE_URL}/product/${id}/`);
        fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const handleOrderDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await axios.delete(`${API_BASE_URL}/order/${id}/`);
        fetchOrders();
      } catch (error) {
        console.error("Error deleting order:", error);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  const handleAddProduct = async () => {
    try {
      await axios.post(`${API_BASE_URL}/product/`, newProduct);
      fetchProducts();
      setNewProduct({ name: "", category: "", description: "", quantity_in_stock: 0, price: 0, threshold_level: 0, extra_charge_percent: 5 });
      setShowAddProductForm(false);
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "products":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8">
            <h2 className="text-3xl font-bold text-yellow-400 mb-4">Products</h2>
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={fetchProducts}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors duration-200"
              >
                Refresh Products
              </button>
              <button
                onClick={() => setShowAddProductForm(!showAddProductForm)}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors duration-200"
              >
                <FaPlus className="mr-2" />
                Add Product
              </button>
            </div>
            {showAddProductForm && (
              <div className="bg-gray-800 rounded-lg shadow-md p-4 mb-4 text-white">
                <h3 className="text-lg font-semibold mb-2 text-yellow-400">Add New Product</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300">Product Name</label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      placeholder="Product Name"
                      value={newProduct.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border rounded py-2 px-3 bg-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-300">Product Category</label>
                    <input
                      type="text"
                      name="category"
                      id="category"
                      placeholder="Product Category"
                      value={newProduct.category}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border rounded py-2 px-3 bg-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300">Product Description</label>
                    <input
                      type="text"
                      name="description"
                      id="description"
                      placeholder="Product Description"
                      value={newProduct.description}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border rounded py-2 px-3 bg-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="quantity_in_stock" className="block text-sm font-medium text-gray-300">Quantity in Stock</label>
                    <input
                      type="number"
                      name="quantity_in_stock"
                      id="quantity_in_stock"
                      placeholder="Quantity in Stock"
                      value={newProduct.quantity_in_stock}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border rounded py-2 px-3 bg-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-300">Price (e.g., 19.99)</label>
                    <input
                      type="number"
                      name="price"
                      id="price"
                      placeholder="Price (e.g., 19.99)"
                      value={newProduct.price}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border rounded py-2 px-3 bg-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="threshold_level" className="block text-sm font-medium text-gray-300">Threshold Level</label>
                    <input
                      type="number"
                      name="threshold_level"
                      id="threshold_level"
                      placeholder="Threshold Level"
                      value={newProduct.threshold_level}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border rounded py-2 px-3 bg-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="extra_charge_percent" className="block text-sm font-medium text-gray-300">Extra Charge (%)</label>
                    <input
                      type="number"
                      name="extra_charge_percent"
                      id="extra_charge_percent"
                      placeholder="Extra Charge (%)"
                      value={newProduct.extra_charge_percent}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border rounded py-2 px-3 bg-gray-700 text-white"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddProduct}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded mt-4 transition-colors duration-200"
                >
                  Add Product
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  className="bg-gray-800 rounded-lg shadow-md p-4 flex flex-col justify-between text-white"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-400">{product.name}</h3>
                    <p className="text-sm text-gray-300">Category: {product.category || "N/A"}</p>
                    <p className="text-sm text-gray-300">Description: {product.description || "N/A"}</p>
                    <p className="text-sm text-gray-300">Stock: {product.quantity_in_stock || "0"}</p>
                    <p className="text-sm text-gray-300">Price: ₹{product.price || "0.00"}</p>
                    <p className="text-sm text-gray-300">Threshold: {product.threshold_level || "0"}</p>
                    <p className="text-sm text-gray-300">Extra charge: {product.extra_charge_percent || "0"} %</p>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(product.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors duration-200"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors duration-200"
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      case "orders":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8">
            <h2 className="text-3xl font-bold text-yellow-400 mb-4">Orders</h2>
            <div className="flex items-center mb-4">
              <input
                type="text"
                placeholder="Search Orders by ID or Status"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="border rounded py-2 px-3 mr-2 w-full bg-gray-800 text-white"
              />
              <button
                onClick={fetchOrders}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors duration-200"
              >
                <FaSearch className="mr-2" />
                Refresh Orders
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800 rounded-lg shadow-md text-white">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="py-2 px-4 border-b text-left">ID</th>
                    <th className="py-2 px-4 border-b text-left">Items</th>
                    <th className="py-2 px-4 border-b text-left">Status</th>
                    <th className="py-2 px-4 border-b text-left">Total Amount</th>
                    <th className="py-2 px-4 border-b text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const itemCounts = order.items.reduce((acc, item) => {
                      acc[item.product_name] = (acc[item.product_name] || 0) + item.quantity;
                      return acc;
                    }, {});

                    return (
                      <tr key={order.id} className="hover:bg-gray-700">
                        <td className="py-2 px-4 border-b">{order.id}</td>
                        <td className="py-2 px-4 border-b">
                          {Object.entries(itemCounts).map(([productName, quantity]) => (
                            <div key={productName}>
                              {productName} ({quantity})
                            </div>
                          ))}
                        </td>
                        <td className="py-2 px-4 border-b">{order.status}</td>
                        <td className="py-2 px-4 border-b">₹{order.total_amount}</td>
                        <td className="py-2 px-4 border-b">
                          <button onClick={() => handleOrderDelete(order.id)} className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors duration-200">
                            <FaTrashAlt />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        );
      case "stockAlerts":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8">
            <h2 className="text-3xl font-bold text-yellow-400 mb-4">Stock Alerts</h2>
            <button
              onClick={fetchStockAlerts}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mb-4 transition-colors duration-200"
            >
              Refresh Alerts
            </button>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800 rounded-lg shadow-md text-white">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="py-2 px-4 border-b text-left">ID</th>
                    <th className="py-2 px-4 border-b text-left">Product</th>
                    <th className="py-2 px-4 border-b text-left">Stock Level</th>
                  </tr>
                </thead>
                <tbody>
                  {stockAlerts.map((alert) => (
                    <tr
                      key={alert.id}
                      className={`hover:bg-gray-700 ${alert.stock_level <= 10 ? "bg-gray-500" : ""}`} // Changed to a solid gray color
                    >
                      <td className="py-2 px-4 border-b text-white font-bold">{alert.id}</td> {/* Changed text color and made bold */}
                      <td className="py-2 px-4 border-b text-white font-bold">{alert.product_name}</td> {/* Changed text color and made bold */}
                      <td className="py-2 px-4 border-b text-white font-bold">{alert.stock_level}</td> {/* Changed text color and made bold */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        );
      default:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8">
            Invalid Tab
          </motion.div>
        );
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-gray-900 text-white">
        <header className="bg-gray-900 shadow-md p-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-yellow-400">StockPilot</h1>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <h4 className="text-sm font-semibold text-gray-300">Total Orders</h4>
              <p className="text-lg text-gray-100">{orders.length}</p>
            </div>
            <div className="text-center">
              <h4 className="text-sm font-semibold text-gray-300">Total Products</h4>
              <p className="text-lg text-gray-100">{products.length}</p>
            </div>
            <div className="text-center">
              <h4 className="text-sm font-semibold text-gray-300">Low Stock Alerts</h4>
              <p className="text-lg text-gray-100">{stockAlerts.length}</p>
            </div>
          </div>
        </header>
        <div className="flex">
          <aside className="w-64 bg-gray-800 p-4">
            <nav>
              <ul className="space-y-2">
                <li
                  className={`p-2 rounded cursor-pointer ${activeTab === "products" ? "bg-gray-700" : "hover:bg-gray-700"}`}
                  onClick={() => setActiveTab("products")}
                >
                  <FaBoxOpen className="inline-block mr-2" /> Products
                </li>
                <li
                  className={`p-2 rounded cursor-pointer ${activeTab === "orders" ? "bg-gray-700" : "hover:bg-gray-700"}`}
                  onClick={() => setActiveTab("orders")}
                >
                  <FaShoppingCart className="inline-block mr-2" /> Orders
                </li>
                <li
                  className={`p-2 rounded cursor-pointer ${activeTab === "stockAlerts" ? "bg-gray-700" : "hover:bg-gray-700"}`}
                  onClick={() => setActiveTab("stockAlerts")}
                >
                  <FaBell className="inline-block mr-2" /> Stock Alerts
                </li>
              </ul>
            </nav>
          </aside>
          <main className="flex-1">{renderContent()}</main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default UserInventoryPage;
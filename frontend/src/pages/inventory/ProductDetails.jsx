import React from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Package, 
  Truck, 
  Calendar, 
  DollarSign,
  BarChart2,
  ShoppingCart,
  AlertTriangle,
  Tag
} from 'lucide-react';

// Mock product data
const mockProducts = [
  { 
    id: '1', 
    name: 'Wireless Headphones', 
    sku: 'WH-001', 
    category: 'Electronics',
    description: 'High-quality wireless headphones with noise cancellation and 20-hour battery life.',
    stock: 45, 
    reorderLevel: 15, 
    supplier: 'Tech Supplies Inc.',
    supplierContact: 'contact@techsupplies.com',
    price: 89.99,
    cost: 45.50,
    location: 'Warehouse A, Shelf 12',
    lastRestocked: '2025-04-01',
    salesHistory: [
      { month: 'Jan', sales: 24 },
      { month: 'Feb', sales: 18 },
      { month: 'Mar', sales: 32 },
      { month: 'Apr', sales: 28 },
    ],
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
    ]
  }
];

const ProductDetails = () => {
  const { id } = useParams();
  
  // Find the product with the matching ID
  const product = mockProducts.find(p => p.id === id);
  
  if (!product) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
          <p className="mt-2 text-gray-600">The product you're looking for doesn't exist or has been removed.</p>
          <Link to="/inventory" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <ArrowLeft size={16} className="mr-2" />
            Back to Inventory
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <Link to="/inventory" className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-600">SKU: {product.sku}</p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Edit size={16} className="mr-2" />
            Edit
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            <Trash2 size={16} className="mr-2" />
            Delete
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Image and Basic Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <div className="aspect-w-1 aspect-h-1 mb-6">
                <img 
                  src={product.images[0]} 
                  alt={product.name} 
                  className="object-cover rounded-lg w-full h-64"
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Product Information</h3>
                  <div className="mt-2 border-t border-gray-200 pt-2">
                    <dl className="divide-y divide-gray-200">
                      <div className="py-3 flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Category</dt>
                        <dd className="text-sm text-gray-900">{product.category}</dd>
                      </div>
                      <div className="py-3 flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">SKU</dt>
                        <dd className="text-sm text-gray-900">{product.sku}</dd>
                      </div>
                      <div className="py-3 flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Price</dt>
                        <dd className="text-sm text-gray-900">${product.price.toFixed(2)}</dd>
                      </div>
                      <div className="py-3 flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Cost</dt>
                        <dd className="text-sm text-gray-900">${product.cost.toFixed(2)}</dd>
                      </div>
                      <div className="py-3 flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Profit Margin</dt>
                        <dd className="text-sm text-green-600">
                          {(((product.price - product.cost) / product.price) * 100).toFixed(2)}%
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Product Details and Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stock Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Stock Information</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                      <Package size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Current Stock</p>
                      <p className="text-2xl font-bold">{product.stock}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Reorder Level</p>
                      <p className="text-2xl font-bold">{product.reorderLevel}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Last Restocked</p>
                      <p className="text-lg font-bold">{product.lastRestocked}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-2">Storage Location</h4>
                <p className="text-gray-700">{product.location}</p>
              </div>
              
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-2">Stock Status</h4>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      product.stock > product.reorderLevel * 2 
                        ? 'bg-green-600' 
                        : product.stock > product.reorderLevel 
                        ? 'bg-yellow-500'
                        : 'bg-red-600'
                    }`} 
                    style={{ width: `${Math.min((product.stock / (product.reorderLevel * 3)) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-red-600">Reorder Level ({product.reorderLevel})</span>
                  <span className="text-xs text-green-600">Optimal Stock ({product.reorderLevel * 3})</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Product Description */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Product Description</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700">{product.description}</p>
              
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <Tag size={14} className="mr-1" />
                    Wireless
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <Tag size={14} className="mr-1" />
                    Audio
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <Tag size={14} className="mr-1" />
                    Bluetooth
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Supplier Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Supplier Information</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-gray-100 text-gray-600 mr-4">
                  <Truck size={24} />
                </div>
                <div>
                  <p className="text-lg font-medium">{product.supplier}</p>
                  <p className="text-sm text-gray-600">{product.supplierContact}</p>
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <ShoppingCart size={16} className="mr-2" />
                  Place Order
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  View Supplier Details
                </button>
              </div>
            </div>
          </div>
          
          {/* Sales History */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Sales History</h3>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-end space-x-2">
                {product.salesHistory.map((data) => (
                  <div key={data.month} className="flex flex-col items-center flex-1">
                    <div 
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${(data.sales / 40) * 100}%` }}
                    ></div>
                    <div className="mt-2 text-xs font-medium text-gray-600">{data.month}</div>
                    <div className="text-sm font-bold">{data.sales}</div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-end">
                <Link to="/analytics" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                  <BarChart2 size={16} className="mr-1" />
                  View detailed analytics
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProductDetails;
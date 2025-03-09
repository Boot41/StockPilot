import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import MainLayout from '../components/layout/MainLayout';
import { FiSend, FiChevronRight, FiBarChart2, FiPackage, FiTrendingUp, FiUpload } from 'react-icons/fi';
import axiosInstance from '../api/axiosInstance';

const FORECAST_URL = 'http://127.0.0.1:8000/api/inventory-forecast/';
const CHATBOT_URL = 'http://127.0.0.1:8000/api/chatbot/';
const EXCEL_ANALYZE_URL = 'http://127.0.0.1:8000/api/excel/analyze/';
const EXCEL_UPLOAD_URL = 'http://127.0.0.1:8000/api/excel/upload/';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Something went wrong!</strong>
          <span className="block sm:inline"> Please try refreshing the page.</span>
        </div>
      );
    }
    return this.props.children;
  }
}

const markdownComponents = {
  // Table styling
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-4">
      <table className="w-full divide-y divide-gray-200 border border-gray-200 rounded-lg shadow-sm table-fixed" {...props} />
    </div>
  ),
  th: ({ node, ...props }) => (
    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b min-w-[120px]" {...props} />
  ),
  td: ({ node, ...props }) => {
    // Check if content is a number or currency
    const content = props.children?.toString() || '';
    const isNumber = /^\d/.test(content);
    const isCurrency = content.startsWith('$');
    return (
      <td className={`px-6 py-3 text-sm border-b border-gray-100 ${isNumber || isCurrency ? 'text-right font-medium' : ''}`} {...props} />
    );
  },
  p: ({ node, ...props }) => <p className="text-gray-800" {...props} />,
  li: ({ node, ordered, ...props }) => <li className="text-gray-800" {...props} />,
  h1: ({ node, ...props }) => <h1 className="text-gray-800 font-bold" {...props} />,
  h2: ({ node, ...props }) => <h2 className="text-gray-800 font-bold" {...props} />,
  h3: ({ node, ...props }) => <h3 className="text-gray-800 font-bold" {...props} />,
  h4: ({ node, ...props }) => <h4 className="text-gray-800 font-bold" {...props} />,
  h5: ({ node, ...props }) => <h5 className="text-gray-800 font-bold" {...props} />,
  h6: ({ node, ...props }) => <h6 className="text-gray-800 font-bold" {...props} />,
};

const Dashboard = () => {
  const [uploadedData, setUploadedData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showQuickQueries, setShowQuickQueries] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [messages, setMessages] = useState([{
    id: 1,
    sender: 'bot',
    text: `# Welcome to StockPilot Enterprise AI!\n\n${!uploadedData ? `Here's what I can help you with:\n\n**Data Management**\n- Upload and analyze your inventory data\n- Support for Excel (.xlsx) and CSV files\n- Automatic column mapping and validation\n\n**Analysis & Insights**\n- Inventory level monitoring\n- Stock alerts and recommendations\n- Sales trend analysis\n- Category performance metrics\n\nTo get started, click the "Upload Inventory Data" button in the top right corner.` : 'How can I assist with your inventory management today?'}`,
    data: null
  }]);
  const [input, setInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatContainerRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      setUploadError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Get token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to upload files.');
      }

      // Upload and analyze Excel file
      const analyzeResponse = await axiosInstance.post(EXCEL_ANALYZE_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      console.log('Excel analysis response:', analyzeResponse);

      if (analyzeResponse.data.status === 'error') {
        throw new Error(analyzeResponse.data.error || 'Failed to analyze file');
      }

      // Store the analyzed data
      setUploadedData(analyzeResponse.data);
      localStorage.setItem('uploadedData', JSON.stringify(analyzeResponse.data));

      // Show success message with the analyzed data
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'bot',
        text: `# Excel File Analyzed Successfully!\n\n${analyzeResponse.data.data}\n\n## Summary\n- Total Products: ${analyzeResponse.data.stats.total_products}\n- Categories: ${analyzeResponse.data.stats.categories}\n- Total Value: $${analyzeResponse.data.stats.total_value.toLocaleString()}\n\nYou can now ask questions about your inventory data.`,
        data: analyzeResponse.data
      }]);

    } catch (error) {
      console.error('Error during file processing:', error);
      let errorMessage = 'Failed to process file. ';

      if (error.response?.status === 401) {
        errorMessage = 'Please log in again to upload files.';
      } else if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else if (error.message) {
        errorMessage += error.message;
      }

      setUploadError(errorMessage);
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'bot',
        text: `Error: ${errorMessage}`,
        isError: true
      }]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const messageId = Date.now();
    setMessages(prev => [...prev, { id: messageId, sender: 'user', text }]);
    setInput('');
    setIsBotTyping(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to use the chatbot.');
      }

      // Get chat session ID and Excel data
      const chatSessionId = uploadedData?.chat_session_id;
      const excelData = uploadedData?.stats ? {
        products: uploadedData.products,
        stats: uploadedData.stats,
        upload_time: new Date().toISOString()
      } : null;

      const response = await axiosInstance.post(CHATBOT_URL, {
        message: text,
        chat_session_id: chatSessionId,
        excel_data: excelData
      });

      console.log('Chatbot response:', response);

      if (response.data.status === 'error') {
        throw new Error(response.data.error || 'Failed to get response');
      }

      // Handle inventory update success
      if (response.data.clear_excel_data) {
        setUploadedData(null);
        localStorage.removeItem('uploadedData');
      }

      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'bot',
        text: response.data.response || 'I apologize, but I was unable to process your request.',
        data: response.data.data,
        isError: false
      }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      let errorMessage = 'Failed to get response. ';
      
      if (error.response?.status === 401) {
        errorMessage = 'Please log in again to use the chatbot.';
      } else if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else if (error.message) {
        errorMessage += error.message;
      }

      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'bot',
        text: `Error: ${errorMessage}`,
        isError: true
      }]);
    } finally {
      setIsBotTyping(false);
    }
  };

  const getQuickQueries = () => {
    if (!uploadedData) {
      return [
        'How do I upload my inventory data?',
        'What file formats do you support?',
        'How can you help me analyze my inventory?',
        'What insights can you provide?'
      ];
    }
    return [
    'Show current inventory levels',
    'Display sales trends for last quarter',
    'Predict demand for next month',
    'Show low-stock alerts',
    'Generate inventory health report',
    'Analyze supplier performance'
    ];
  };

  const showSuggestions = messages.filter(m => m.sender === 'user').length === 0;
  const quickQueriesList = getQuickQueries();

  const scrollToMessage = useCallback((messageId) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('bg-blue-50');
      setTimeout(() => messageElement.classList.remove('bg-blue-50'), 2000);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, []);

  useEffect(scrollToBottom, [messages]);

  const renderInventoryTable = (data, keys) => (
    <div className="mt-4 overflow-x-auto">
      <h4 className="text-sm font-semibold mb-2 text-gray-800">Data Table</h4>
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr>
            {keys.map((key) => (
              <th key={key} className="px-6 py-3 text-gray-800 font-bold border border-gray-300">
                {key.replace(/_/g, ' ').toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-gray-100 divide-y divide-gray-300">
          {data.map((item) => (
            <tr key={item.id}>
              {keys.map((key) => (
                <td key={key} className="px-6 py-4 text-gray-800 border border-gray-300">
                  {item[key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const EmptyState = () => (
  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
    <div className="mx-auto h-12 w-12 text-gray-400">
      <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    </div>
    <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory data</h3>
    <p className="mt-1 text-sm text-gray-500">Get started by uploading your inventory data</p>
    <div className="mt-6">
      <button
        type="button"
        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Upload Inventory
      </button>
    </div>
  </div>
);

const ProductTable = ({ data }) => {
  const parseProducts = (text) => {
    try {
      const tableContent = text.split('|---------|')[1];
      if (!tableContent) return [];
      
      return tableContent.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [name, category, sold, revenue, daily] = line.split('|').slice(1, -1);
          return {
            name: name?.trim(),
            category: category?.trim(),
            sold: sold?.trim(),
            revenue: revenue?.trim(),
            daily: daily?.trim()
          };
        });
    } catch (e) {
      console.error('Error parsing product data:', e);
      return [];
    }
  };

  const products = parseProducts(data);

  if (!products || products.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product Name</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Sold</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Revenue</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Daily Sales</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {products.map((product, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{product.category}</td>
              <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">{product.sold}</td>
              <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">{product.revenue}</td>
              <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">{product.daily}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const renderFormattedContent = (message) => {
    const renderContext = (context) => {
      if (!context) return null;
      return (
        <div className="mt-4 space-y-4">
          {context.inventory_stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(context.inventory_stats).map(([key, value]) => {
                // Handle special case for top_categories which is an array of objects
                if (key === 'top_categories' && Array.isArray(value)) {
                  return value.map((category, idx) => (
                    <div key={`${key}_${idx}`} className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">TOP CATEGORY {idx + 1}</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {category.category}
                        <div className="text-sm text-gray-600">
                          Count: {category.count}, Value: ${category.value?.toLocaleString() || 0}
                        </div>
                      </div>
                    </div>
                  ));
                }
                
                // Handle regular stats
                return (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">{key.replace(/_/g, ' ').toUpperCase()}</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {typeof value === 'number' ? 
                        key.includes('value') ? 
                          `$${value.toLocaleString()}` : 
                          value.toLocaleString() 
                        : String(value)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {context.recent_activity && (
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {Object.entries(context.recent_activity).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">{key.replace(/_/g, ' ').toUpperCase()}</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    };

    // Handle array data (inventory tables)
    if (message.data && Array.isArray(message.data)) {
      return (
        <div className="space-y-4">
          {message.text && typeof message.text === 'string' && (
            <div className="prose max-w-none">
              <ReactMarkdown components={markdownComponents}>{message.text}</ReactMarkdown>
            </div>
          )}
          {renderInventoryTable(message.data, message.keys)}
        </div>
      );
    }
    
    // Handle forecast data
    if (message.data?.forecast || (message.context?.inventory_stats && message.context?.recent_activity)) {
      return (
        <div className="space-y-4">
          {/* Render markdown response */}
          {message.text && typeof message.text === 'string' && (
            <div className="prose max-w-none">
              <ReactMarkdown components={markdownComponents}>{message.text}</ReactMarkdown>
            </div>
          )}
          
          {/* Render forecast data if available */}
          {message.data?.forecast && (
            <div className="mt-4 bg-white shadow rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Forecast Insights</h3>
              <div className="space-y-3">
                {message.data.forecast.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">{item.product_name}</span>
                    <span className="font-medium text-gray-900">
                      Predicted: {item.predicted_demand} units
                      <span className="ml-2 text-xs text-gray-500">
                        ({Math.round(item.confidence_score * 100)}% confidence)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Render inventory stats if available */}
          {message.context?.inventory_stats && (
            <div className="mt-4 bg-white shadow rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600">Total Products</div>
                  <div className="text-2xl font-semibold">{message.context.inventory_stats.total_products}</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-sm text-yellow-600">Low Stock Items</div>
                  <div className="text-2xl font-semibold">{message.context.inventory_stats.low_stock}</div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-sm text-red-600">Out of Stock</div>
                  <div className="text-2xl font-semibold">{message.context.inventory_stats.out_of_stock}</div>
                </div>
              </div>
              
              {/* Render top categories if available */}
              {message.context.inventory_stats.top_categories && (
                <div className="mt-4">
                  <h4 className="text-md font-medium text-gray-700 mb-2">Top Categories</h4>
                  <div className="space-y-2">
                    {message.context.inventory_stats.top_categories.map((cat, index) => (
                      <div key={index} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                        <span className="text-gray-600">{cat.category}</span>
                        <span className="font-medium">
                          {cat.count} items (${cat.value.toLocaleString()})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Render recent activity if available */}
          {message.context?.recent_activity && (
            <div className="mt-4 bg-white shadow rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600">New Orders</div>
                  <div className="text-2xl font-semibold">{message.context.recent_activity.orders}</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-600">New Products</div>
                  <div className="text-2xl font-semibold">{message.context.recent_activity.new_products}</div>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <div className="text-sm text-indigo-600">Updated Products</div>
                  <div className="text-2xl font-semibold">{message.context.recent_activity.updated_products}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (message.sender === 'user') {
      return <div className="text-gray-800">{message.text}</div>;
    }

    return (
      <div className="space-y-4">
        {message.text && typeof message.text === 'string' && (
          <div className="prose max-w-none
            prose-headings:text-gray-900 prose-headings:font-bold prose-headings:my-4
            prose-p:text-gray-800 prose-p:my-2
            prose-strong:text-gray-900 prose-strong:font-semibold
            prose-ul:my-3 prose-ul:list-disc prose-ul:pl-4
            prose-li:my-1
            prose-table:text-sm prose-table:w-full
            prose-th:bg-gray-50 prose-th:text-gray-600 prose-th:font-semibold prose-th:p-3
            prose-td:text-gray-700 prose-td:p-3
          ">
            <ReactMarkdown components={markdownComponents}>{message.text}</ReactMarkdown>
          </div>
        )}
        {message.context && renderContext(message.context)}
        {message.data?.forecast && (
          <div className="mt-4 bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Forecast Insights</h3>
            <div className="space-y-3">
              {message.data.forecast.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">{item.product_name}</span>
                  <span className="font-medium text-gray-900">
                    Predicted: {item.predicted_demand} units
                    <span className="ml-2 text-xs text-gray-500">
                      ({Math.round(item.confidence_score * 100)}% confidence)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: input.trim(),
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsBotTyping(true);

    try {
      const result = await handleSendMessage(input.trim());
    } catch (error) {
      console.error('Handle send error:', error);
      let errorMessage = '⚠️ An unexpected error occurred.';
      
      if (error.response) {
        // Server responded with error
        const data = error.response.data;
        if (data.error?.type === 'NameError' && data.error?.message.includes('API_KEY')) {
          errorMessage = '⚠️ API configuration error. Please contact support.';
        } else if (data.error?.type === 'ConnectionError') {
          errorMessage = '⚠️ Connection error. Please check your internet connection.';
        } else if (data.error?.message) {
          errorMessage = `⚠️ ${data.error.message}`;
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage = '⚠️ No response from server. Please try again.';
      }
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: errorMessage,
        isError: true,
        context: error.response?.data?.context || {}
      }]);
    } finally {
      setIsBotTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    setTimeout(() => document.getElementById('chat-input').focus(), 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) handleSend();
  };

  return (
    <ErrorBoundary>
      <MainLayout>
        <div className="bg-white min-h-screen p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Dashboard Header */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold">
                  <span className="text-blue-600">StockPilot</span>
                </h1>
                <div className="h-8 w-px bg-gray-300"></div>
                <h2 className="text-xl text-gray-600">Enterprise Dashboard</h2>
              </div>
              <div className="flex items-center gap-4">
                <label className="relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors">
                  <FiUpload className="h-5 w-5 mr-2" />
                  Upload Inventory Data
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex gap-0 h-[calc(100vh-12rem)] relative">
              {/* Chat History Sidebar - Mobile Responsive */}
              <div 
                className={`absolute md:relative w-64 bg-white rounded-lg shadow-md border border-blue-400/50 p-4 overflow-y-auto h-full transition-transform duration-300 z-10 ${showHistory ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} drop-shadow-md`}
              >
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className="absolute -right-8 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-r-lg md:hidden"
                >
                  {showHistory ? '←' : '→'}
                </button>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Chat History</h3>
                <div className="space-y-2">
                  {messages
                    .filter(m => m.sender === 'user')
                    .map((message) => (
                      <button
                        key={message.id}
                        onClick={() => {
                          scrollToMessage(message.id);
                          if (window.innerWidth < 768) setShowHistory(false);
                        }}
                        className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-50 rounded truncate transition-colors"
                      >
                        {message.text.substring(0, 50)}{message.text.length > 50 ? '...' : ''}
                      </button>
                    ))}
                </div>
              </div>

              {/* Chat Container */}
              <div className="flex-1 bg-white rounded-lg shadow-md border border-blue-400/50 overflow-hidden flex flex-col ml-0 md:ml-6 drop-shadow-md">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold flex items-center gap-3">
                    <span className="text-gray-800">StockPilot AI</span>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Secure Connection • SSL Encrypted
                    </div>
                  </h2>
                </div>

                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Welcome message without file upload section */}
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        id={`message-${message.id}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} transition-colors duration-300`}
                      >
                        <div className={`max-w-4xl p-4 rounded-2xl ${
                          message.sender === 'bot'
                            ? message.isError
                              ? 'bg-red-50 text-red-800 border border-red-200'
                              : 'bg-white shadow-sm border border-gray-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                          <div className="flex items-start gap-3">
                            {message.sender === 'bot' && !message.isError && (
                              <div className="bg-blue-400/10 p-2 rounded-lg">
                                <FiBarChart2 className="text-blue-400 text-xl" />
                              </div>
                            )}
                            <div className="space-y-2">
                              {renderFormattedContent(message)}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isBotTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 text-gray-400"
                    >
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                      Analyzing inventory patterns...
                    </motion.div>
                  )}
                </div>

                {/* Chat Input Area */}
                <div className="p-4 border-t border-gray-200">
                  {showSuggestions && (
                    <div className="mb-4 grid grid-cols-2 gap-2">
                      {quickQueriesList.slice(0, 4).map((query, index) => (
                        <motion.button
                          key={index}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleSuggestionClick(query)}
                          className="text-left p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all text-sm text-gray-600 flex items-center gap-2"
                        >
                          <FiChevronRight className="text-blue-500" />
                          {query}
                        </motion.button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-3 items-center bg-gray-50 rounded-lg p-2">
                    <input
                      id="chat-input"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask StockPilot about inventory, sales, or predictions..."
                      className="flex-1 p-4 bg-gray-100 backdrop-blur-lg rounded-xl border border-gray-300 focus:border-blue-400/50 focus:ring-0 outline-none transition-all text-gray-800"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSend}
                      className="p-4 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl flex items-center gap-2 hover:shadow-xl transition-all"
                    >
                      <FiSend className="text-white" />
                      <span className="hidden md:inline">Send</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </ErrorBoundary>
  );
}

export default Dashboard;
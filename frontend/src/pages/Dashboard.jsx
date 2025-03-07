import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import MainLayout from '../components/layout/MainLayout';
import { FiSend, FiChevronRight, FiBarChart2, FiPackage, FiTrendingUp, FiUpload } from 'react-icons/fi';

const FORECAST_URL = 'http://127.0.0.1:8000/api/inventory-forecast/';
const CHATBOT_URL = 'http://127.0.0.1:8000/api/chatbot/';

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
  table: ({ node, ...props }) => <table className="min-w-full border border-gray-600" {...props} />,
  th: ({ node, ...props }) => <th className="px-6 py-3 text-white font-bold border border-gray-600" {...props} />,
  td: ({ node, ...props }) => <td className="px-6 py-4 text-white border border-gray-600" {...props} />,
  p: ({ node, ...props }) => <p className="text-white" {...props} />,
  li: ({ node, ordered, ...props }) => <li className="text-white" {...props} />,
  h1: ({ node, ...props }) => <h1 className="text-white font-bold" {...props} />,
  h2: ({ node, ...props }) => <h2 className="text-white font-bold" {...props} />,
  h3: ({ node, ...props }) => <h3 className="text-white font-bold" {...props} />,
  h4: ({ node, ...props }) => <h4 className="text-white font-bold" {...props} />,
  h5: ({ node, ...props }) => <h5 className="text-white font-bold" {...props} />,
  h6: ({ node, ...props }) => <h6 className="text-white font-bold" {...props} />,
};

const Dashboard = () => {
  const [uploadedData, setUploadedData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showQuickQueries, setShowQuickQueries] = useState(true);
  const [messages, setMessages] = useState([{
    id: 1,
    sender: 'bot',
    text: `Welcome to StockPilot Enterprise AI! ${!uploadedData ? 'To get started, upload your inventory data using the upload button below.' : 'How can I assist with your inventory management today?'}`,
    data: null
  }]);
  const [input, setInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatContainerRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);
    setUploadError(null);

    try {
      // First, upload to inventory-forecast endpoint
      const forecastResponse = await fetch(FORECAST_URL, {
        method: 'POST',
        body: formData,
      });

      if (!forecastResponse.ok) throw new Error('Upload failed');

      const forecastData = await forecastResponse.json();
      setUploadedData(forecastData);
      
      // Initialize chatbot context with the uploaded data
      const chatbotResponse = await fetch(CHATBOT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Initialize context with uploaded inventory data' }] }],
          uploaded_data: forecastData
        })
      });

      if (!chatbotResponse.ok) {
        console.warn('Failed to initialize chatbot context, but file upload succeeded');
      }

      // Add a system message about successful upload
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'bot',
        text: 'Inventory data uploaded successfully! You can now ask questions about your uploaded data.',
        data: forecastData
      }]);
    } catch (error) {
      setUploadError('Failed to upload file. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
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

  const scrollToBottom = useCallback(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  },);

  useEffect(scrollToBottom, [messages]);

  // Render a responsive inventory table with dynamic keys
  const renderInventoryTable = (data, keys) => (
    <div className="mt-4 overflow-x-auto">
      <h4 className="text-sm font-semibold mb-2 text-white">Data Table</h4>
      <table className="min-w-full border border-gray-600">
        <thead>
          <tr>
            {keys.map((key) => (
              <th key={key} className="px-6 py-3 text-white font-bold border border-gray-600">
                {key.replace(/_/g, ' ').toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-gray-700 divide-y divide-gray-600">
          {data.map((item) => (
            <tr key={item.id}>
              {keys.map((key) => (
                <td key={key} className="px-6 py-4 text-white border border-gray-600">
                  {item[key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderFormattedContent = (message) => {
    if (message.data && Array.isArray(message.data)) {
      return (
        <>
          {message.text && typeof message.text === 'string' && (
            <div className="prose prose-invert">
              <ReactMarkdown components={markdownComponents}>{message.text}</ReactMarkdown>
            </div>
          )}
          {renderInventoryTable(message.data, message.keys)}
        </>
      );
    }

    if (message.text && typeof message.text === 'string') {
      return (
        <div className="prose prose-invert">
          <ReactMarkdown components={markdownComponents}>{message.text}</ReactMarkdown>
        </div>
      );
    }

    return null;
  };

  const getChatbotResponse = async (query) => {
    // Include uploaded data context in the request if available
    const requestData = {
      contents: [{
        parts: [{ text: query }]
      }],
      uploaded_data: uploadedData
    };
    console.log('Request Data:', requestData);
    console.log('Query:', query);
    try {
      const response = await fetch(CHATBOT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.error || 'API request failed');
      }
      const data = await response.json();
      console.log("API response:", data);

      // Check if the response contains tabular data
      if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
        const keys = Object.keys(data.data[0]);
        return {
          answer: data.answer || "Here's the data:",
          data: data.data,
          keys: keys
        };
      }

      return data.response || data;
    } catch (error) {
      console.error('Chatbot error:', error);
      return {
        answer: '⚠️ Error processing request. Please try again.',
        isError: true
      };
    }
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
      const result = await getChatbotResponse(input.trim());
      let botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: result.answer,
        data: result.data,
        keys: result.keys, // Include keys here
        isError: result.isError,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Handle send error:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: '⚠️ Unexpected error occurred. Please try again later.',
        isError: true
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
        <div className="bg-gradient-to-br from-gray-900 to-blue-900 min-h-screen p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Dashboard Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Enterprise Dashboard
              </h1>
              <div className="flex gap-4">
                <div className="bg-gray-800/50 p-3 rounded-xl flex items-center gap-2">
                  <FiPackage className="text-blue-400" />
                  <span className="text-sm">Live Inventory Tracking</span>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-xl flex items-center gap-2">
                  <FiTrendingUp className="text-green-400" />
                  <span className="text-sm">Real-time Analytics</span>
                </div>
              </div>
            </motion.div>

            {/* AI Chat Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-700/30 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-700/30">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                    StockPilot AI
                  </span>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Secure Connection • SSL Encrypted
                  </div>
                </h2>
              </div>

              <div ref={chatContainerRef} className="h-[calc(100vh-16rem)] overflow-y-auto p-6 space-y-6">
                {/* File Upload Section - Only show if no data uploaded */}
                {!uploadedData && (
                  <div className="mb-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700/30">
                    <label htmlFor="file-upload" className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                      <div className="flex flex-col items-center">
                        <FiUpload className="w-6 h-6 mb-2 text-gray-400" />
                        <span className="text-sm text-gray-400">
                          {isUploading ? 'Uploading...' : 'Upload Inventory Data (CSV/Excel)'}
                        </span>
                      </div>
                    </label>
                    {uploadError && (
                      <div className="mt-2 text-red-500 text-sm text-center">{uploadError}</div>
                    )}
                  </div>
                )}
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-2xl p-4 rounded-2xl ${
                        message.sender === 'bot'
                          ? message.isError
                            ? 'bg-red-500/10 border border-red-400/30'
                            : 'bg-gray-700/30 border border-gray-600/30'
                          : 'bg-blue-500/10 border border-blue-400/30'
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
              <div className="p-6 border-t border-gray-700/30">
                <div className="space-y-4">
                  {showSuggestions && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {quickQueriesList.slice(0, 4).map((query, index) => (
                        <motion.button
                          key={index}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleSuggestionClick(query)}
                          className="text-left p-2 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-all text-sm flex items-center gap-2 text-blue-300"
                        >
                          <FiChevronRight />
                          {query}
                          <FiChevronRight className="text-gray-400" />
                        </motion.button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-4">
                    <input
                      id="chat-input"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask StockPilot about inventory, sales, or predictions..."
                      className="flex-1 p-4 bg-gray-700/30 backdrop-blur-lg rounded-xl border border-gray-600/30 focus:border-blue-400/50 focus:ring-0 outline-none transition-all text-white"
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
            </motion.div>
          </div>
        </div>
      </MainLayout>
    </ErrorBoundary>
  );
};

export default Dashboard;
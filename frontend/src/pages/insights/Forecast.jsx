import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import ErrorBoundary from '../../components/ErrorBoundary';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Forecast = () => {
  const [timeframe, setTimeframe] = useState('6 months');
  const [forecastData, setForecastData] = useState(null);
  const [geminiData, setGeminiData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bgGradient] = useState('bg-gradient-to-b from-blue-900 to-gray-900');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch data from both APIs
        const [forecastResponse, geminiResponse] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/forecast/'),
          fetch('http://127.0.0.1:8000/api/gemini-insights/')
        ]);

        // Check if both responses are ok
        if (!forecastResponse.ok) {
          throw new Error(`Forecast API error: ${forecastResponse.status}`);
        }
        if (!geminiResponse.ok) {
          throw new Error(`Gemini API error: ${geminiResponse.status}`);
        }

        // Parse JSON responses
        const forecastData = await forecastResponse.json();
        const geminiData = await geminiResponse.json();

        // Validate data structure
        if (!forecastData?.forecast || !Array.isArray(forecastData.forecast)) {
          throw new Error('Invalid forecast data format');
        }
        if (!geminiData?.forecast || !Array.isArray(geminiData.forecast)) {
          throw new Error('Invalid gemini data format');
        }

        setForecastData(forecastData.forecast);
        setGeminiData(geminiData.forecast);

        // Combine data with proper null checks
        const combinedData = forecastData.forecast.map((forecastItem) => {
          if (!forecastItem?.product_name) {
            return null;
          }
          
          const geminiItem = geminiData.forecast.find(
            (item) => item?.product_name === forecastItem.product_name
          );
          
          return {
            ...forecastItem,
            predicted_sales: geminiItem?.predicted_sales || 0,
            confidence_score: geminiItem?.confidence_score || 0,
          };
        }).filter(Boolean); // Remove any null items

        setFilteredData(combinedData);
      } catch (err) {
        console.error('Forecast data fetch error:', err);
        setError(err.message || 'Failed to fetch forecast data');
        setFilteredData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (forecastData) {
      const filtered = forecastData.filter((item) =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, forecastData]);

  const getChartData = () => {
    if (!Array.isArray(filteredData) || filteredData.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Predicted Sales',
            data: [],
            backgroundColor: 'rgba(255, 206, 86, 0.5)',
            borderColor: 'rgba(255, 206, 86, 1)',
            borderWidth: 1,
          },
          {
            label: 'Confidence Score',
            data: [],
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels: filteredData.map((item) => item?.product_name || 'Unknown'),
      datasets: [
        {
          label: 'Predicted Sales',
          data: filteredData.map((item) => Number(item?.predicted_sales) || 0),
          backgroundColor: 'rgba(255, 206, 86, 0.5)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1,
        },
        {
          label: 'Confidence Score',
          data: filteredData.map((item) => Number(item?.confidence_score) || 0),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: 'easeOutBounce',
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Forecast Sales (Next 30 Days)',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            return `${label}: ${context.parsed.y}`;
          },
        },
      },
    },
    hover: {
      onHover: (event, chartElement) => {
        event.native.target.style.cursor = chartElement.length ? 'pointer' : 'default';
      },
    },
  };

  return (
    <ErrorBoundary>
      <MainLayout>
        <div className={`min-h-screen p-8 text-white ${bgGradient}`}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl font-extrabold text-yellow-400 mb-2">
              AI-Powered Demand Forecast
            </h1>
            <p className="text-gray-300 mb-6">
              Predictive analytics to optimize your inventory levels
            </p>
          </motion.div>

          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex space-x-3 mb-4 sm:mb-0">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-700 rounded-md bg-gray-800 text-white"
              >
                <option>3 months</option>
                <option>6 months</option>
                <option>12 months</option>
              </select>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 border rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors duration-300 flex items-center"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft size={16} className="mr-2" /> Back
              </motion.button>
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
            {loading && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-gray-300"
              >
                Loading forecast data...
              </motion.p>
            )}
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-red-500"
              >
                Error: {error}
              </motion.p>
            )}
            {!loading && !error && filteredData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                className="bg-gray-800 rounded-lg shadow overflow-hidden p-6 h-96"
              >
                <Bar data={getChartData()} options={chartOptions} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </MainLayout>
    </ErrorBoundary>
  );
};

export default Forecast;
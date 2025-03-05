import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import ErrorBoundary from '../../components/ErrorBoundary'; // Adjust path as needed
import { ArrowLeft, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Forecast = () => {
  const [timeframe, setTimeframe] = useState('6 months');
  const [forecastData, setForecastData] = useState(null); // forecastData from API
  const [filteredData, setFilteredData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bgGradient] = useState("bg-gradient-to-b from-blue-900 to-gray-900");
  const [importedData, setImportedData] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchForecastData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/gemini-insights/');
        if (!response.ok) {
          throw new Error('Failed to fetch forecast data');
        }
        const data = await response.json();
        setForecastData(data.forecast);
        setFilteredData(data.forecast);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchForecastData();
  }, []);

  // Filter the forecastData based on search term
  useEffect(() => {
    if (forecastData) {
      const filtered = forecastData.filter(item =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, forecastData]);

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const expectedHeaders = ["Product Name", "Current Stock", "Estimated Days Left"];
          const headers = Object.keys(results.data[0] || {});
          if (!expectedHeaders.every(header => headers.includes(header))) {
            setError("Invalid CSV format. Please ensure the file has the correct headers.");
            return;
          }
          if (results.data.some(row => isNaN(Number(row["Current Stock"])))) {
            setError("Invalid data type in 'Current Stock' column. Please ensure all values are numbers.");
            return;
          }
          setImportedData(results.data);
        },
        error: (error) => {
          setError(`CSV parsing error: ${error.message}`);
        },
      });
    }
  };

  // Prepare data for the bar chart using filteredData
  const getChartData = () => {
    if (!filteredData) return {};
    return {
      labels: filteredData.map(item => item.product_name),
      datasets: [
        {
          label: 'Predicted Sales',
          data: filteredData.map(item => item.predicted_sales),
          backgroundColor: 'rgba(255, 206, 86, 0.5)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1,
        },
        {
          label: 'Confidence Score',
          data: filteredData.map(item => item.confidence_score),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          // Optionally you could show this as another bar (or change chart type)
        }
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: 'easeOutBounce'
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
          }
        }
      }
    },
    hover: {
      onHover: (event, chartElement) => {
        event.native.target.style.cursor = chartElement.length ? 'pointer' : 'default';
      }
    }
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
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 border rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors duration-300 flex items-center"
                onClick={handleImportClick}
              >
                <Upload size={16} className="mr-2" /> Import
              </motion.button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept=".csv"
              />
            </div>
            {/* Search filter input */}
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

          {importedData && (
            <div className="mt-6 bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-300">Imported Data</h2>
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    {Object.keys(importedData[0] || {}).map((key) => (
                      <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-700">
                  {importedData.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, idx) => (
                        <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </MainLayout>
    </ErrorBoundary>
  );
};

export default Forecast;

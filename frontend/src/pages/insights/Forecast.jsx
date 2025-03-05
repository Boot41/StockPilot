import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import ErrorBoundary from '../../components/ErrorBoundary'; // Adjust path as needed
import {
  ArrowLeft,
  Download,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import { useNavigate } from 'react-router-dom';

const Forecast = () => {
  const [timeframe, setTimeframe] = useState('6 months');
  const [expandedSection, setExpandedSection] = useState(null);
  // Initialize forecastData as null (since API returns a number)
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bgGradient] = useState("bg-gradient-to-b from-blue-900 to-gray-900");
  const [importedData, setImportedData] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchForecastData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/forecast/');
        if (!response.ok) {
          throw new Error('Failed to fetch forecast data');
        }
        const data = await response.json();
        // Since data.forecast is a number, set it directly
        setForecastData(data.forecast);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchForecastData();
  }, []);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // CSV export function removed because forecastData is now a number.
  // (You may add CSV export for importedData if needed.)

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
            <div className="flex space-x-3">
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
              {/* CSV export button removed since forecastData is a single value */}
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
            {!loading && !error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-800 rounded-lg shadow overflow-hidden p-6"
              >
                <h3 className="text-lg font-medium text-gray-300">
                  Forecast Sales (Last 30 Days)
                </h3>
                <p className="text-gray-400">
                  {forecastData} (Simple Average)
                </p>
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

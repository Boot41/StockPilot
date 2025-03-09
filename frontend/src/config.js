// API configuration
export const API_BASE_URL = 'http://localhost:8000';  // Development
// export const API_BASE_URL = window.location.origin;  // Production

// API endpoints
export const ENDPOINTS = {
    FORECAST: `${API_BASE_URL}/api/forecast/`,
    GEMINI_INSIGHTS: `${API_BASE_URL}/api/gemini-insights/`,
    INVENTORY: `${API_BASE_URL}/api/inventory/`,
    PRODUCTS: `${API_BASE_URL}/api/product/`,
    ORDERS: `${API_BASE_URL}/api/order/`,
};

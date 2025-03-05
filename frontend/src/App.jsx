import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/inventory/Inventory";
import ProductDetails from "./pages/inventory/ProductDetails";
import Forecast from "./pages/insights/Forecast";
import Analytics from "./pages/insights/Analytics";
import Settings from "./pages/insights/Settings";  // Added Settings
import HelpSupport from "./pages/insights/HelpSupport"; // Added Help & Support
import UserInventoryPage from "./pages/inventory/UserInventoryPage"; // ✅ Import the new page

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route - Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes - Require Authentication */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
          <Route path="/inventory/:id" element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />
          <Route path="/forecast" element={<ProtectedRoute><Forecast /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/help-support" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
          
          {/* ✅ New Route for User Inventory Page */}
          <Route path="/user-inventory" element={<ProtectedRoute><UserInventoryPage /></ProtectedRoute>} />

          {/* Redirect unknown routes to Landing Page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

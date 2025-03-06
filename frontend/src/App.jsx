import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Import pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword"; // Added ForgotPassword Page
import ResetPassword from "./pages/auth/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/inventory/Inventory";
import ProductDetails from "./pages/inventory/ProductDetails";
import Forecast from "./pages/insights/Forecast";
import ImportForecast from "./pages/insights/ImportForecast";
import Analytics from "./pages/insights/Analytics";
import Settings from "./pages/insights/Settings";
import HelpSupport from "./pages/insights/HelpSupport";
import UserInventoryPage from "./pages/inventory/UserInventoryPage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} /> {/* Added Forgot Password Route */}
          <Route path="/reset-password/:uidb64/:token" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
          <Route path="/inventory/:id" element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />
          <Route path="/forecast" element={<ProtectedRoute><Forecast /></ProtectedRoute>} />
          <Route path="/import-forecast" element={<ProtectedRoute><ImportForecast /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/help-support" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
          <Route path="/user-inventory" element={<ProtectedRoute><UserInventoryPage /></ProtectedRoute>} />

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

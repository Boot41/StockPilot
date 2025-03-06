import React, { useState } from "react";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://127.0.0.1:8000/auth/forgot-password/", { email });

      setIsSuccess(true);
      setMessage("Password reset link sent to your email.");
    } catch (error) {
      setIsSuccess(false);
      setMessage(error.response?.data?.error || "Failed to send reset link.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800/50 p-12 rounded-3xl shadow-xl w-full max-w-md border border-gray-700/50">
        <h2 className="text-2xl font-bold mb-6">Forgot Password</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm mb-2">Enter your email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-700/50 rounded-xl border border-gray-600"
              required
            />
          </div>
          {message && (
            <div className={`p-3 rounded-xl ${isSuccess ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
              {message}
            </div>
          )}
          <button type="submit" className="w-full p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-bold text-gray-900">
            Send Reset Link
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;

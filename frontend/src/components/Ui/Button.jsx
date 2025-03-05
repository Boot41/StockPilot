import React from "react";

export default function Button({ children, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-lg font-semibold rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-300 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 shadow-md hover:from-yellow-500 hover:to-yellow-600 ${className}`}
    >
      {children}
    </button>
  );
}

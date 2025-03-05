import React from 'react';
import { Bell, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user } = useAuth();

  const handleProfileClick = () => {
    alert(`User Info:\nName: ${user?.name || 'User'}\nEmail: ${user?.email || 'user@example.com'}`);
  };

  const handleNotificationClick = () => {
    alert('Email already sent');
  };

  return (
    <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
      <div className="flex-1">
        <h1 className="text-xl font-bold text-gray-800">Next-Gen Inventory</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <button 
          className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
          onClick={handleNotificationClick}
        >
          <Bell size={20} />
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
            3
          </span>
        </button>
        
        <div 
          className="flex items-center space-x-2 cursor-pointer"
          onClick={handleProfileClick}
        >
          <div className="bg-gray-200 rounded-full p-2">
            <User size={20} className="text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

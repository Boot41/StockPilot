import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  TrendingUp, 
  BarChart2, 
  Settings, 
  HelpCircle, 
  LogOut, 
  ClipboardList,
  Upload // Using Upload icon for "Import & Forecast"
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();

  const navItems = [
    { path: '/import-forecast', name: 'Import & Forecast', icon: Upload }, // New item at the top
    { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/inventory', name: 'Inventory', icon: Package },
    { path: '/forecast', name: 'Forecast', icon: TrendingUp },
    { path: '/analytics', name: 'Analytics', icon: BarChart2 },
    { path: '/user-inventory', name: 'User Inventory', icon: ClipboardList },
    { path: '/settings', name: 'Settings', icon: Settings },
    { path: '/help-support', name: 'Help & Support', icon: HelpCircle },
  ];

  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen flex flex-col">
      {/* Sidebar Header */}
      <div className="p-5 border-b border-gray-700 flex items-center space-x-2">
        <Package size={24} className="text-blue-400" />
        <h1 className="text-xl font-bold">StockPilot</h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map(({ path, name, icon: Icon }) => (
            <li key={path}>
              <NavLink 
                to={path}
                className={({ isActive }) => 
                  `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-700 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'
                  }`
                }
              >
                <Icon size={20} />
                <span>{name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button 
          onClick={logout}
          className="flex items-center space-x-3 p-3 w-full rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

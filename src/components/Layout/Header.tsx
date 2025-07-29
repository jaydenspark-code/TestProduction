import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LogOut, User, Home, Crown, Megaphone, FileText, Calendar, Settings, Briefcase } from 'lucide-react';
import EarnProLogo from '../Logo/EarnProLogo';
import SettingsModal from '../Settings/SettingsModal';

const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [showAdvertiseDropdown, setShowAdvertiseDropdown] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Consistent color utilities based on theme
  const getThemeColors = () => {
    if (theme === 'professional') {
      return {
        headerBg: 'bg-gray-900 border-gray-700/50',
        logoGradient: 'bg-gradient-to-r from-cyan-400 to-blue-400',
        navActive: 'bg-gray-700 text-white shadow-lg shadow-cyan-500/20',
        navInactive: 'text-white/70 hover:bg-gray-700/50 hover:text-white',
        dropdownBg: 'bg-gray-800/95',
        dropdownHover: 'hover:bg-gray-700/50 hover:text-white',
        divider: 'border-gray-700/50',
        buttonGradient: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700',
        settingsHover: 'hover:bg-gray-700/50 hover:text-white'
      };
    } else {
      return {
        headerBg: 'bg-gradient-to-br from-purple-600 to-blue-600 border-white/20',
        logoGradient: 'bg-gradient-to-r from-purple-400 to-blue-400',
        navActive: 'bg-white/20 text-white shadow-lg',
        navInactive: 'text-white/70 hover:bg-white/10 hover:text-white',
        dropdownBg: 'bg-white/10 border-white/20',
        dropdownHover: 'hover:bg-white/10 text-white/70 hover:text-white',
        divider: 'border-white/20',
        buttonGradient: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700',
        settingsHover: 'hover:bg-white/10 text-white/70 hover:text-white'
      };
    }
  };

  const colors = getThemeColors();

  // Only show navigation items if user is authenticated AND has paid
  const getNavItems = () => {
    if (!isAuthenticated || !user?.isPaidUser) return [];

    const baseItems = [
      { path: '/dashboard', label: 'Dashboard', icon: Home },
      { path: '/tasks', label: 'Tasks', icon: Calendar },
    ];

    if (user?.role === 'admin' || user?.role === 'superadmin') {
      return [
        ...baseItems,
        { path: '/admin', label: 'Admin', icon: Briefcase },
        { path: '/legal', label: 'Legal & Guidance', icon: FileText },
      ];
    }

    switch (user?.role) {
      case 'agent':
        return [
          ...baseItems,
          { path: '/agent/portal', label: 'Agent Portal', icon: Crown },
          { path: '/legal', label: 'Legal & Guidance', icon: FileText },
        ];
      case 'advertiser':
        return [
          ...baseItems,
          { path: '/advertiser/portal', label: 'Advertise with Us', icon: Megaphone },
          { path: '/legal', label: 'Legal & Guidance', icon: FileText },
        ];
      default:
        return [
          ...baseItems,
          { path: '/agent', label: 'Agent Program', icon: Crown },
          { path: '/advertise', label: 'Advertise with Us', icon: Megaphone },
          { path: '/legal', label: 'Legal & Guidance', icon: FileText },
        ];
    }
  };

  return (
    <>
      <header className={`${colors.headerBg} sticky top-0 z-50 border-b backdrop-blur-lg`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <EarnProLogo size={40} />
              <span className={`text-2xl font-bold ${colors.logoGradient} bg-clip-text text-transparent`}>
                EarnPro
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              {getNavItems().map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${isActive(item.path)
                        ? colors.navActive
                        : colors.navInactive
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <div className="relative group">
                    <button className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 ${colors.settingsHover}`}>
                      <Settings className="w-5 h-5" />
                    </button>

                    <div className={`absolute right-0 top-full mt-2 w-56 ${colors.dropdownBg} backdrop-blur-lg rounded-lg border ${colors.divider} shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50`}>
                      <div className="p-2">
                        <button
                          onClick={() => setShowSettings(true)}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${colors.dropdownHover}`}
                        >
                          <Settings className="w-4 h-4" />
                          <span>Theme Settings</span>
                        </button>

                        <Link
                          to="/profile"
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${colors.dropdownHover}`}
                        >
                          <User className="w-4 h-4" />
                          <span>My Profile</span>
                        </Link>

                        <hr className={`my-2 ${colors.divider}`} />

                        <button
                          onClick={logout}
                          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-red-300 hover:bg-red-500/20 transition-all duration-200"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-white/70">
                    <User className="w-5 h-5" />
                    <span className="hidden sm:inline">{user?.fullName}</span>
                    {user?.isAgent && (
                      <Crown className="w-4 h-4 text-amber-400 ml-1" />
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowSettings(true)}
                    className={`p-2 rounded-lg transition-all duration-200 ${colors.settingsHover}`}
                  >
                    <Settings className="w-5 h-5" />
                  </button>

                  <Link
                    to="/login"
                    className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className={`px-4 py-2 ${colors.buttonGradient} text-white rounded-lg transition-all duration-200 shadow-lg`}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
};

export default Header;

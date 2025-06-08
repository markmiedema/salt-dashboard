import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calculator, Menu, X, Users, BarChart3, FolderOpen, FileText } from 'lucide-react';
import { TeamsService } from '../../services/teamsService';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTeamsContext, setIsTeamsContext] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const initializeTeams = async () => {
      const inTeams = await TeamsService.initialize();
      setIsTeamsContext(inTeams);
    };
    initializeTeams();
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, path: '/dashboard' },
    { id: 'clients', name: 'Clients', icon: Users, path: '/clients' },
    { id: 'projects', name: 'Projects', icon: FolderOpen, path: '/projects' },
    { id: 'reports', name: 'Reports', icon: FileText, path: '/reports' }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const getCurrentPageId = () => {
    const currentPath = location.pathname;
    const currentNav = navigation.find(nav => nav.path === currentPath);
    return currentNav?.id || 'dashboard';
  };

  const currentPageId = getCurrentPageId();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => handleNavigation('/dashboard')}
          >
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Tax Agency Dashboard</h1>
              {isTeamsContext && (
                <span className="text-xs text-blue-600 font-medium">Microsoft Teams</span>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
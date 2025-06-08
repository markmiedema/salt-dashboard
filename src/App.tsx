import React, { useState, useEffect } from 'react';
import Header from './components/common/Header';
import EnhancedDashboard from './pages/EnhancedDashboard';
import ReactQueryDashboard from './pages/ReactQueryDashboard';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import Reports from './pages/Reports';
import ErrorBoundary from './components/common/ErrorBoundary';
import { QueryProvider } from './providers/QueryProvider';
import { TeamsService } from './services/teamsService';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [useReactQuery, setUseReactQuery] = useState(true); // Toggle between implementations

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await TeamsService.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsInitialized(true); // Continue anyway
      }
    };

    initializeApp();
  }, []);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'clients':
        return <Clients />;
      case 'projects':
        return <Projects />;
      case 'reports':
        return <Reports />;
      default:
        // Toggle between React Query and custom caching implementations
        return useReactQuery ? <ReactQueryDashboard /> : <EnhancedDashboard />;
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Tax Agency Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          <Header currentPage={currentPage} onNavigate={setCurrentPage} />
          
          {/* Development Toggle */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <span className="text-sm text-yellow-800">
                  Data Management: {useReactQuery ? 'React Query' : 'Custom Caching'}
                </span>
                <button
                  onClick={() => setUseReactQuery(!useReactQuery)}
                  className="text-sm bg-yellow-200 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-300 transition-colors"
                >
                  Switch to {useReactQuery ? 'Custom Caching' : 'React Query'}
                </button>
              </div>
            </div>
          )}
          
          <main>
            {renderCurrentPage()}
          </main>
        </div>
      </ErrorBoundary>
    </QueryProvider>
  );
}

export default App;
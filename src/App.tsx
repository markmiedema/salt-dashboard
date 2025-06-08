import React, { useState, useEffect } from 'react';
import Header from './components/common/Header';
import EnhancedDashboard from './pages/EnhancedDashboard';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import Reports from './pages/Reports';
import ErrorBoundary from './components/common/ErrorBoundary';
import { TeamsService } from './services/teamsService';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);

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
        return <EnhancedDashboard />;
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
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Header currentPage={currentPage} onNavigate={setCurrentPage} />
        <main>
          {renderCurrentPage()}
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
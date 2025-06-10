import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/common/Header';
import EnhancedDashboard from './pages/EnhancedDashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Reports from './pages/Reports';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';
import { TeamsService } from './services/teamsService';

function App() {
  const [isInitialized, setIsInitialized] = React.useState(false);

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
      <ToastProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<EnhancedDashboard />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/clients/:id" element={<ClientDetail />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/reports" element={<Reports />} />
                {/* Catch-all route for 404s */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
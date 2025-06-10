import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProjectRedirect } from '../hooks/useProjectRedirect';
import LoadingSpinner from './common/LoadingSpinner';

/**
 * Component to handle legacy project URLs and redirect to new client-centric structure
 * Redirects /projects/:id to /clients/:clientId/projects/:id
 */
const ProjectRedirect: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { loading, error } = useProjectRedirect(projectId);

  // Log the redirect attempt for monitoring
  useEffect(() => {
    if (projectId) {
      console.log(`Redirecting legacy project URL: /projects/${projectId}`);
    }
  }, [projectId]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600\" fill="none\" stroke="currentColor\" viewBox="0 0 24 24">
              <path strokeLinecap="round\" strokeLinejoin="round\" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Redirect Failed</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            The project URL you're trying to access could not be redirected to the new format.
          </p>
          <button
            onClick={() => window.location.href = '/clients'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <LoadingSpinner size="lg" />
        <h2 className="text-lg font-semibold text-gray-900 mt-4 mb-2">
          Redirecting to Project
        </h2>
        <p className="text-gray-600 mb-4">
          We're updating the URL structure to provide a better experience.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-left">
              <h4 className="text-sm font-medium text-blue-900">URL Structure Update</h4>
              <p className="text-sm text-blue-700 mt-1">
                Projects are now organized under their respective clients for better navigation.
              </p>
            </div>
          </div>
        </div>
        {projectId && (
          <p className="text-xs text-gray-500 mt-4">
            Redirecting project: {projectId}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProjectRedirect;
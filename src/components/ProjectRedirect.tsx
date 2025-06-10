import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useAdvancedData';
import LoadingSpinner from './common/LoadingSpinner';
import { getClientProjectUrl } from '../utils/navigation';

/**
 * Component to handle legacy project URLs and redirect to new client-centric structure
 * Redirects /projects/:id to /clients/:clientId/projects/:id
 */
const ProjectRedirect: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, loading } = useProjects();

  useEffect(() => {
    if (!loading && projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        // Redirect to new client-centric URL structure
        const newUrl = getClientProjectUrl(project.client_id, project.id);
        navigate(newUrl, { replace: true });
      } else {
        // Project not found, redirect to clients list
        navigate('/clients', { replace: true });
      }
    }
  }, [projects, loading, projectId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="Redirecting to project..." />
      </div>
    );
  }

  // If we get here, project wasn't found
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
        <p className="text-gray-600 mb-6">The project you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/clients', { replace: true })}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Clients
        </button>
      </div>
    </div>
  );
};

export default ProjectRedirect;
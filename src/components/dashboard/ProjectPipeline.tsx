import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, AlertCircle, Pause } from 'lucide-react';
import { Project } from '../../types/database';
import { getClientProjectUrl } from '../../utils/navigation';

interface ProjectPipelineProps {
  projects: Project[];
  loading: boolean;
}

const ProjectPipeline: React.FC<ProjectPipelineProps> = ({ projects, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getStatusInfo = (status: Project['status']) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'yellow',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800'
        };
      case 'in_progress':
        return {
          icon: AlertCircle,
          color: 'blue',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'emerald',
          bgColor: 'bg-emerald-100',
          textColor: 'text-emerald-800'
        };
      case 'on_hold':
        return { icon: Pause, color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
      default:
        return { icon: Clock, color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
    }
  };

  const getTypeLabel = (type: Project['type']) => {
    const labels = {
      nexus_analysis: 'Nexus Analysis',
      vda: 'VDA',
      tax_prep: 'Tax Preparation',
      bookkeeping: 'Bookkeeping',
      advisory: 'Advisory'
    };
    return labels[type] || type;
  };

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleProjectClick = (project: Project) => {
    navigate(getClientProjectUrl(project.client_id, project.id));
  };

  const sortedProjects = projects.sort((a, b) => {
    // Sort by status priority, then by due date
    const statusPriority = { in_progress: 1, pending: 2, on_hold: 3, completed: 4 };
    const aPriority = statusPriority[a.status] || 5;
    const bPriority = statusPriority[b.status] || 5;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }

    return 0;
  });

  const statusCounts = projects.reduce(
    (acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Project Pipeline</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">In Progress ({statusCounts.in_progress || 0})</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600">Pending ({statusCounts.pending || 0})</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sortedProjects.slice(0, 6).map((project) => {
          const statusInfo = getStatusInfo(project.status);
          const Icon = statusInfo.icon;
          const daysUntilDue = getDaysUntilDue(project.due_date);

          return (
            <div
              key={project.id}
              onClick={() => handleProjectClick(project)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">{project.name}</h4>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}
                    >
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <span>Type:</span>
                      <span className="font-medium">{getTypeLabel(project.type)}</span>
                    </span>
                    {project.amount && (
                      <span className="flex items-center space-x-1">
                        <span>Value:</span>
                        <span className="font-medium">${project.amount.toLocaleString()}</span>
                      </span>
                    )}
                    {project.due_date && (
                      <span className="flex items-center space-x-1">
                        <span>Due:</span>
                        <span
                          className={`font-medium ${
                            daysUntilDue !== null && daysUntilDue < 7
                              ? 'text-red-600'
                              : daysUntilDue !== null && daysUntilDue < 14
                                ? 'text-yellow-600'
                                : 'text-gray-900'
                          }`}
                        >
                          {new Date(project.due_date).toLocaleDateString()}
                          {daysUntilDue !== null && (
                            <span className="ml-1">
                              ({daysUntilDue > 0 ? `${daysUntilDue} days` : 'Overdue'})
                            </span>
                          )}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className={`p-2 rounded-lg ${statusInfo.bgColor}`}>
                  <Icon className={`w-4 h-4 text-${statusInfo.color}-600`} />
                </div>
              </div>

              {project.estimated_hours && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>
                      {project.actual_hours} / {project.estimated_hours} hours
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((project.actual_hours / project.estimated_hours) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No projects in the pipeline</p>
          <p className="text-sm">Projects will appear here as they're added</p>
        </div>
      )}

      {/* Footer with navigation to clients */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{projects.length}</span> total projects
          </div>
          <button 
            onClick={() => navigate('/clients')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All Clients →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectPipeline;
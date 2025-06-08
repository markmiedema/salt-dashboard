import React from 'react';
import { Clock, CheckCircle, AlertCircle, Pause, AlertTriangle, Calendar } from 'lucide-react';
import { useEnhancedProjects, useEnhancedProjectStats } from '../../hooks/useAdvancedData';
import { ProjectService } from '../../services/projectService';
import { Project } from '../../types/database';
import CacheStatus from '../common/CacheStatus';

const EnhancedProjectPipeline: React.FC = () => {
  const { 
    projects, 
    loading: projectsLoading, 
    error: projectsError, 
    isStale: projectsStale, 
    refresh: refreshProjects,
    updateProgress 
  } = useEnhancedProjects();
  
  const { 
    data: stats, 
    loading: statsLoading, 
    error: statsError, 
    isStale: statsStale, 
    refresh: refreshStats 
  } = useEnhancedProjectStats();

  const loading = projectsLoading || statsLoading;
  const hasError = projectsError || statsError;
  const isStale = projectsStale || statsStale;

  if (loading && !projects.length && !stats) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Use fallback data if no stats available
  const safeStats = stats || {
    total: projects.length,
    pending: projects.filter(p => p.status === 'pending').length,
    inProgress: projects.filter(p => p.status === 'in_progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    onHold: projects.filter(p => p.status === 'on_hold').length,
    overdue: 0,
    totalValue: projects.reduce((sum, p) => sum + (p.amount || 0), 0),
    averageValue: 0,
    completionRate: 0,
    averageHours: 0
  };

  const getStatusInfo = (status: Project['status']) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
      case 'in_progress':
        return { icon: AlertCircle, color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' };
      case 'completed':
        return { icon: CheckCircle, color: 'emerald', bgColor: 'bg-emerald-100', textColor: 'text-emerald-800' };
      case 'on_hold':
        return { icon: Pause, color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
      default:
        return { icon: Clock, color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
    }
  };

  const getTypeLabel = (type: Project['type']) => {
    const labels = {
      'nexus_analysis': 'Nexus Analysis',
      'vda': 'VDA',
      'tax_prep': 'Tax Preparation',
      'bookkeeping': 'Bookkeeping',
      'advisory': 'Advisory'
    };
    return labels[type] || type;
  };

  const getPriorityLevel = (project: Project): 'high' | 'medium' | 'low' => {
    return ProjectService.getProjectPriority(project);
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
    }
  };

  // Sort projects by priority and due date
  const sortedProjects = projects
    .map(project => ({
      ...project,
      priority: getPriorityLevel(project),
      daysUntilDue: ProjectService.getDaysUntilDue(project.due_date)
    }))
    .sort((a, b) => {
      // First sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      
      // Then by status
      const statusOrder = { in_progress: 0, pending: 1, on_hold: 2, completed: 3 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      
      // Finally by due date
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      
      return 0;
    });

  const overdueProjects = sortedProjects.filter(p => 
    p.daysUntilDue !== null && p.daysUntilDue < 0 && p.status !== 'completed'
  );

  const upcomingDeadlines = sortedProjects.filter(p => 
    p.daysUntilDue !== null && p.daysUntilDue >= 0 && p.daysUntilDue <= 7 && p.status !== 'completed'
  );

  const statusCards = [
    { 
      label: 'In Progress', 
      value: safeStats.inProgress, 
      color: 'blue',
      percentage: safeStats.total > 0 ? (safeStats.inProgress / safeStats.total) * 100 : 0
    },
    { 
      label: 'Pending', 
      value: safeStats.pending, 
      color: 'yellow',
      percentage: safeStats.total > 0 ? (safeStats.pending / safeStats.total) * 100 : 0
    },
    { 
      label: 'Overdue', 
      value: safeStats.overdue, 
      color: 'red',
      percentage: safeStats.total > 0 ? (safeStats.overdue / safeStats.total) * 100 : 0
    },
    { 
      label: 'Completed', 
      value: safeStats.completed, 
      color: 'emerald',
      percentage: safeStats.completionRate
    }
  ];

  const handleRefresh = () => {
    refreshProjects();
    refreshStats();
  };

  const handleProgressUpdate = async (projectId: string, newHours: number) => {
    try {
      await updateProgress(projectId, newHours);
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Project Pipeline</h3>
          <div className="flex items-center space-x-4 mt-1">
            <p className="text-sm text-gray-600">
              ${safeStats.totalValue.toLocaleString()} total value • {safeStats.completionRate.toFixed(0)}% completion rate
            </p>
            <CacheStatus
              isStale={isStale}
              loading={loading}
              error={hasError}
              onRefresh={handleRefresh}
              className="text-xs"
            />
          </div>
        </div>
        <div className="text-sm text-gray-600">
          {safeStats.overdue > 0 && (
            <span className="text-red-600 font-medium">
              {safeStats.overdue} overdue
            </span>
          )}
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statusCards.map((card, index) => (
          <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            <div className="text-sm text-gray-600 mb-2">{card.label}</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full bg-${card.color}-500 transition-all duration-300`}
                style={{ width: `${Math.min(card.percentage, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {card.percentage.toFixed(0)}%
            </div>
          </div>
        ))}
      </div>

      {/* Alerts Section */}
      {(overdueProjects.length > 0 || upcomingDeadlines.length > 0) && (
        <div className="mb-6 space-y-3">
          {overdueProjects.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h4 className="text-sm font-medium text-red-900">
                  {overdueProjects.length} Overdue Project{overdueProjects.length !== 1 ? 's' : ''}
                </h4>
              </div>
              <div className="space-y-1">
                {overdueProjects.slice(0, 3).map((project) => (
                  <div key={project.id} className="flex items-center justify-between text-sm">
                    <span className="text-red-800">{project.name}</span>
                    <span className="text-red-600">
                      {Math.abs(project.daysUntilDue!)} days overdue
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {upcomingDeadlines.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-yellow-600" />
                <h4 className="text-sm font-medium text-yellow-900">
                  {upcomingDeadlines.length} Due This Week
                </h4>
              </div>
              <div className="space-y-1">
                {upcomingDeadlines.slice(0, 3).map((project) => (
                  <div key={project.id} className="flex items-center justify-between text-sm">
                    <span className="text-yellow-800">{project.name}</span>
                    <span className="text-yellow-600">
                      {project.daysUntilDue === 0 ? 'Due today' : `${project.daysUntilDue} days`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Project List */}
      <div className="space-y-4">
        {sortedProjects.slice(0, 6).map((project) => {
          const statusInfo = getStatusInfo(project.status);
          const Icon = statusInfo.icon;
          const priorityColor = getPriorityColor(project.priority);
          
          return (
            <div key={project.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">{project.name}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColor}`}>
                      {project.priority} priority
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                    <span>Type: <span className="font-medium">{getTypeLabel(project.type)}</span></span>
                    {project.amount && (
                      <span>Value: <span className="font-medium">${project.amount.toLocaleString()}</span></span>
                    )}
                    {project.due_date && (
                      <span>Due: 
                        <span className={`font-medium ml-1 ${
                          project.daysUntilDue !== null && project.daysUntilDue < 0 ? 'text-red-600' : 
                          project.daysUntilDue !== null && project.daysUntilDue < 7 ? 'text-yellow-600' : 
                          'text-gray-900'
                        }`}>
                          {new Date(project.due_date).toLocaleDateString()}
                          {project.daysUntilDue !== null && (
                            <span className="ml-1">
                              ({project.daysUntilDue > 0 ? `${project.daysUntilDue} days` : 
                                project.daysUntilDue === 0 ? 'Today' : 'Overdue'})
                            </span>
                          )}
                        </span>
                      </span>
                    )}
                  </div>
                  
                  {project.estimated_hours && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{project.actual_hours} / {project.estimated_hours} hours ({Math.round((project.actual_hours / project.estimated_hours) * 100)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((project.actual_hours / project.estimated_hours) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className={`p-2 rounded-lg ${statusInfo.bgColor} ml-4`}>
                  <Icon className={`w-4 h-4 text-${statusInfo.color}-600`} />
                </div>
              </div>
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

      {/* Summary Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            <span className="font-medium">${safeStats.averageValue.toLocaleString()}</span> average project value
          </div>
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            View All Projects →
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProjectPipeline;
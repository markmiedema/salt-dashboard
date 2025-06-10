import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Routes, Route, Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  Building,
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  FolderOpen,
  Plus,
  Edit,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { useClients, useProjects } from '../hooks/useAdvancedData';
import { ProjectService } from '../services/projectService';
import { buildBreadcrumbsWithId, getClientProjectUrl } from '../utils/navigation';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ProjectDetail from './ProjectDetail';

const ClientDetails: React.FC = () => {
  const { clientId, projectId } = useParams<{ clientId: string; projectId?: string }>();
  const navigate = useNavigate();
  const { clients, loading: clientsLoading } = useClients();
  const { projects, loading: projectsLoading } = useProjects();
  
  const [client, setClient] = useState(null);
  const [clientProjects, setClientProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!clientsLoading && !projectsLoading && clientId) {
      const foundClient = clients.find(c => c.id === clientId);
      if (foundClient) {
        setClient(foundClient);
        const relatedProjects = projects.filter(p => p.client_id === clientId);
        setClientProjects(relatedProjects);
      }
    }
  }, [clientId, clients, projects, clientsLoading, projectsLoading]);

  const handleBack = () => {
    navigate('/clients');
  };

  const handleProjectClick = (projectId: string) => {
    navigate(getClientProjectUrl(clientId!, projectId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800';
      case 'prospect':
        return 'bg-blue-100 text-blue-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProjectStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
      case 'in_progress':
        return { icon: AlertCircle, color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' };
      case 'completed':
        return { icon: CheckCircle, color: 'emerald', bgColor: 'bg-emerald-100', textColor: 'text-emerald-800' };
      case 'on_hold':
        return { icon: Clock, color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
      default:
        return { icon: Clock, color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      nexus_analysis: 'Nexus Analysis',
      vda: 'VDA',
      tax_prep: 'Tax Preparation',
      bookkeeping: 'Bookkeeping',
      advisory: 'Advisory'
    };
    return labels[type] || type;
  };

  const getEntityTypeIcon = (entityType: string) => {
    return entityType === 'business' ? Building : User;
  };

  const calculateClientStats = () => {
    const totalValue = clientProjects.reduce((sum, p) => sum + (p.amount || 0), 0);
    const activeProjects = clientProjects.filter(p => p.status === 'in_progress').length;
    const completedProjects = clientProjects.filter(p => p.status === 'completed').length;
    const totalHours = clientProjects.reduce((sum, p) => sum + p.actual_hours, 0);

    return {
      totalValue,
      activeProjects,
      completedProjects,
      totalProjects: clientProjects.length,
      totalHours
    };
  };

  // If we're showing a specific project, render the project detail
  if (projectId) {
    return (
      <Routes>
        <Route path="projects/:projectId" element={<ProjectDetail />} />
      </Routes>
    );
  }

  const stats = calculateClientStats();

  if (clientsLoading || projectsLoading) {
    return (
      <>
        <Helmet>
          <title>Loading Client - Tax Agency Dashboard</title>
        </Helmet>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading client details..." />
        </div>
      </>
    );
  }

  if (!client) {
    return (
      <>
        <Helmet>
          <title>Client Not Found - Tax Agency Dashboard</title>
        </Helmet>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Client Not Found</h1>
            <p className="text-gray-600 mb-6">The client you're looking for doesn't exist.</p>
            <button
              onClick={handleBack}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Clients
            </button>
          </div>
        </div>
      </>
    );
  }

  const EntityIcon = getEntityTypeIcon(client.entity_type);

  return (
    <>
      <Helmet>
        <title>{client.name} - Tax Agency Dashboard</title>
        <meta name="description" content={`Client details for ${client.name}`} />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Clients
            </button>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start space-x-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white ${
                    client.entity_type === 'business' ? 'bg-purple-500' : 'bg-blue-500'
                  }`}>
                    <EntityIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{client.name}</h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(client.status)}`}>
                        {client.status}
                      </span>
                      <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-700 rounded-full">
                        {client.entity_type}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Client since {new Date(client.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {client.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-900">{client.email}</p>
                    </div>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-gray-900">{client.phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="text-gray-900">{new Date(client.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Client Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalProjects}</div>
                  <div className="text-sm text-gray-600">Total Projects</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">${stats.totalValue.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Value</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{stats.activeProjects}</div>
                  <div className="text-sm text-gray-600">Active Projects</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalHours}</div>
                  <div className="text-sm text-gray-600">Total Hours</div>
                </div>
              </div>

              {client.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
                  <p className="text-gray-900">{client.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('projects')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'projects'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Projects ({clientProjects.length})
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'activity'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Activity
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Projects */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
                  <button
                    onClick={() => setActiveTab('projects')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All
                  </button>
                </div>
                
                <div className="space-y-4">
                  {clientProjects.slice(0, 3).map((project) => {
                    const statusInfo = getProjectStatusInfo(project.status);
                    const Icon = statusInfo.icon;
                    const daysUntilDue = ProjectService.getDaysUntilDue(project.due_date);
                    
                    return (
                      <div
                        key={project.id}
                        onClick={() => handleProjectClick(project.id)}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-gray-900">{project.name}</h4>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                                {project.status.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>{getTypeLabel(project.type)}</span>
                              {project.amount && (
                                <span>${project.amount.toLocaleString()}</span>
                              )}
                              {project.due_date && (
                                <span className={
                                  daysUntilDue !== null && daysUntilDue < 7 ? 'text-red-600' : ''
                                }>
                                  Due {new Date(project.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <Icon className={`w-5 h-5 text-${statusInfo.color}-600`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {clientProjects.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No projects yet</p>
                    <p className="text-sm">Projects will appear here as they're created</p>
                  </div>
                )}
              </div>

              {/* Performance Metrics */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Metrics</h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Project Completion Rate</span>
                      <span className="text-sm font-medium">
                        {stats.totalProjects > 0 ? Math.round((stats.completedProjects / stats.totalProjects) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${stats.totalProjects > 0 ? (stats.completedProjects / stats.totalProjects) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">{stats.completedProjects}</div>
                      <div className="text-xs text-blue-600">Completed</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-xl font-bold text-yellow-600">{stats.activeProjects}</div>
                      <div className="text-xs text-yellow-600">In Progress</div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Average Project Value</span>
                      <span className="font-medium">
                        ${stats.totalProjects > 0 ? Math.round(stats.totalValue / stats.totalProjects).toLocaleString() : '0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">All Projects</h3>
                <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>New Project</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {clientProjects.map((project) => {
                  const statusInfo = getProjectStatusInfo(project.status);
                  const Icon = statusInfo.icon;
                  const daysUntilDue = ProjectService.getDaysUntilDue(project.due_date);
                  
                  return (
                    <div
                      key={project.id}
                      onClick={() => handleProjectClick(project.id)}
                      className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h4 className="text-lg font-medium text-gray-900">{project.name}</h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                              {project.status.replace('_', ' ')}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                            <div>
                              <span className="font-medium">Type:</span> {getTypeLabel(project.type)}
                            </div>
                            {project.amount && (
                              <div>
                                <span className="font-medium">Value:</span> ${project.amount.toLocaleString()}
                              </div>
                            )}
                            {project.due_date && (
                              <div>
                                <span className="font-medium">Due:</span>{' '}
                                <span className={
                                  daysUntilDue !== null && daysUntilDue < 7 ? 'text-red-600 font-medium' : ''
                                }>
                                  {new Date(project.due_date).toLocaleDateString()}
                                  {daysUntilDue !== null && (
                                    <span className="ml-1">
                                      ({daysUntilDue > 0 ? `${daysUntilDue} days` : 'Overdue'})
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {project.estimated_hours && (
                            <div className="mb-2">
                              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>
                                  {project.actual_hours} / {project.estimated_hours} hours (
                                  {Math.round((project.actual_hours / project.estimated_hours) * 100)}%)
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min((project.actual_hours / project.estimated_hours) * 100, 100)}%`
                                  }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {project.notes && (
                            <p className="text-sm text-gray-600">{project.notes}</p>
                          )}
                        </div>
                        
                        <div className={`p-3 rounded-lg ${statusInfo.bgColor} ml-6`}>
                          <Icon className={`w-5 h-5 text-${statusInfo.color}-600`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {clientProjects.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No projects for this client</p>
                  <p className="text-sm">Create a new project to get started</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Project created:</span> {clientProjects[0]?.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {clientProjects[0] ? new Date(clientProjects[0].created_at).toLocaleDateString() : 'No recent activity'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Client added to system</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(client.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {clientProjects.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent activity</p>
                    <p className="text-sm">Activity will appear here as projects are created and updated</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Nested Routes Outlet */}
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default ClientDetails;
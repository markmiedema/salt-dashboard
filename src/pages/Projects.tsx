import React, { useState } from 'react';
import { Plus, Search, Clock, CheckCircle, AlertCircle, Pause, Filter } from 'lucide-react';
import { useProjects, useClients } from '../hooks/useSupabase';
import { Project } from '../types/database';

const Projects: React.FC = () => {
  const { projects, loading: projectsLoading } = useProjects();
  const { clients, loading: clientsLoading } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const loading = projectsLoading || clientsLoading;

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesType = typeFilter === 'all' || project.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

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

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-2">Track and manage your client projects</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search projects by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="nexus_analysis">Nexus Analysis</option>
              <option value="vda">VDA</option>
              <option value="tax_prep">Tax Preparation</option>
              <option value="bookkeeping">Bookkeeping</option>
              <option value="advisory">Advisory</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {filteredProjects.length} Project{filteredProjects.length !== 1 ? 's' : ''}
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredProjects.map((project) => {
            const statusInfo = getStatusInfo(project.status);
            const Icon = statusInfo.icon;
            const daysUntilDue = getDaysUntilDue(project.due_date);
            
            return (
              <div key={project.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                        {getTypeLabel(project.type)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium">Client:</span> {getClientName(project.client_id)}
                      </div>
                      {project.amount && (
                        <div>
                          <span className="font-medium">Value:</span> ${project.amount.toLocaleString()}
                        </div>
                      )}
                      {project.due_date && (
                        <div>
                          <span className="font-medium">Due Date:</span>{' '}
                          <span className={
                            daysUntilDue !== null && daysUntilDue < 7 ? 'text-red-600 font-medium' : 
                            daysUntilDue !== null && daysUntilDue < 14 ? 'text-yellow-600 font-medium' : 
                            'text-gray-900'
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

                    {project.notes && (
                      <p className="text-sm text-gray-600 mb-4">{project.notes}</p>
                    )}
                    
                    {project.estimated_hours && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                          <span className="font-medium">Progress</span>
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
                    
                    <div className="text-xs text-gray-500">
                      Created {new Date(project.created_at).toLocaleDateString()} • 
                      Updated {new Date(project.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-6">
                    <div className={`p-3 rounded-lg ${statusInfo.bgColor}`}>
                      <Icon className={`w-5 h-5 text-${statusInfo.color}-600`} />
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        Edit
                      </button>
                      <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">No projects found</p>
            <p className="text-sm text-gray-400">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first project to get started'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
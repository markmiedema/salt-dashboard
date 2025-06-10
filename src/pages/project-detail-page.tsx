import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar,
  Clock,
  DollarSign,
  User,
  Plus,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  FileText,
  MessageSquare,
  Paperclip
} from 'lucide-react';

const ProjectDetailPage = ({ projectId, onBack, project: initialProject, client }) => {
  const [project, setProject] = useState(initialProject || null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(!initialProject);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTaskColumn, setNewTaskColumn] = useState('');
  const [draggedTask, setDraggedTask] = useState(null);

  // Mock data for demonstration
  const mockTasks = [
    {
      id: '1',
      title: 'Initial client consultation',
      description: 'Discuss project scope and requirements',
      status: 'completed',
      assignee: 'John Doe',
      dueDate: '2024-03-01',
      priority: 'high',
      comments: 2,
      attachments: 1
    },
    {
      id: '2',
      title: 'Gather financial documentation',
      description: 'Collect all necessary documents from client',
      status: 'completed',
      assignee: 'Jane Smith',
      dueDate: '2024-03-05',
      priority: 'medium',
      comments: 5,
      attachments: 3
    },
    {
      id: '3',
      title: 'Nexus analysis for 8 states',
      description: 'Analyze tax nexus requirements for each state',
      status: 'in_progress',
      assignee: 'John Doe',
      dueDate: '2024-03-10',
      priority: 'high',
      comments: 3,
      attachments: 2
    },
    {
      id: '4',
      title: 'Prepare compliance recommendations',
      description: 'Draft recommendations based on analysis',
      status: 'in_progress',
      assignee: 'Sarah Johnson',
      dueDate: '2024-03-12',
      priority: 'medium',
      comments: 0,
      attachments: 0
    },
    {
      id: '5',
      title: 'Client review meeting',
      description: 'Present findings and recommendations',
      status: 'todo',
      assignee: 'John Doe',
      dueDate: '2024-03-14',
      priority: 'high',
      comments: 0,
      attachments: 0
    },
    {
      id: '6',
      title: 'Finalize deliverables',
      description: 'Prepare final report and documentation',
      status: 'todo',
      assignee: null,
      dueDate: '2024-03-15',
      priority: 'medium',
      comments: 0,
      attachments: 0
    }
  ];

  const columns = [
    { id: 'todo', title: 'To Do', color: 'gray' },
    { id: 'in_progress', title: 'In Progress', color: 'blue' },
    { id: 'review', title: 'Review', color: 'purple' },
    { id: 'completed', title: 'Completed', color: 'emerald' }
  ];

  useEffect(() => {
    if (!initialProject) {
      // Simulate API call
      setTimeout(() => {
        setProject({
          id: projectId,
          name: 'Q4 2024 Multi-State Tax Analysis',
          type: 'nexus_analysis',
          status: 'in_progress',
          amount: 15000,
          estimated_hours: 40,
          actual_hours: 25,
          due_date: '2024-03-15',
          notes: 'Complex nexus analysis across 8 states',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-03-01T14:30:00Z'
        });
        setLoading(false);
      }, 500);
    }

    // Load tasks
    setTasks(mockTasks);
  }, [projectId, initialProject]);

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    if (draggedTask) {
      setTasks(tasks.map(task => 
        task.id === draggedTask.id ? { ...task, status: newStatus } : task
      ));
      setDraggedTask(null);
    }
  };

  const handleAddTask = (columnId) => {
    setNewTaskColumn(columnId);
    setShowNewTaskForm(true);
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProjectProgress = () => {
    if (!project?.estimated_hours) return 0;
    return Math.round((project.actual_hours / project.estimated_hours) * 100);
  };

  const getDaysRemaining = () => {
    if (!project?.due_date) return null;
    const due = new Date(project.due_date);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {client?.name || 'Client'}
          </button>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{project?.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {client?.name}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Due {project?.due_date ? new Date(project.due_date).toLocaleDateString() : 'Not set'}
                  </span>
                  <span className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    ${project?.amount?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
              
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreVertical className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Progress and Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-2">Progress</p>
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProjectProgress()}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium">{getProjectProgress()}%</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-2">Hours</p>
                <p className="text-lg font-semibold">
                  {project?.actual_hours} / {project?.estimated_hours || '0'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-2">Days Remaining</p>
                <p className={`text-lg font-semibold ${
                  getDaysRemaining() && getDaysRemaining() < 7 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {getDaysRemaining() !== null ? getDaysRemaining() : 'N/A'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-2">Status</p>
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                  {project?.status?.replace('_', ' ') || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{tasks.length} total tasks</span>
              <span>•</span>
              <span>{tasks.filter(t => t.status === 'completed').length} completed</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {columns.map(column => (
              <div
                key={column.id}
                className="bg-gray-50 rounded-lg p-4"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">{column.title}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${column.color}-100 text-${column.color}-800`}>
                    {getTasksByStatus(column.id).length}
                  </span>
                </div>

                <div className="space-y-3">
                  {getTasksByStatus(column.id).map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      
                      {task.description && (
                        <p className="text-xs text-gray-600 mb-3">{task.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {task.priority && (
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="text-xs text-gray-500">
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          {task.comments > 0 && (
                            <span className="flex items-center">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              {task.comments}
                            </span>
                          )}
                          {task.attachments > 0 && (
                            <span className="flex items-center">
                              <Paperclip className="w-3 h-3 mr-1" />
                              {task.attachments}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {task.assignee && (
                        <div className="mt-3 flex items-center">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {task.assignee.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="ml-2 text-xs text-gray-600">{task.assignee}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <button
                    onClick={() => handleAddTask(column.id)}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Add task</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">John Doe</span> completed task "Initial client consultation"
                </p>
                <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <FileText className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Jane Smith</span> uploaded 3 documents
                </p>
                <p className="text-xs text-gray-500 mt-1">5 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Sarah Johnson</span> commented on "Nexus analysis for 8 states"
                </p>
                <p className="text-xs text-gray-500 mt-1">Yesterday</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Task Form Modal */}
      {showNewTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Task</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter task title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter task description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Unassigned</option>
                  <option value="john">John Doe</option>
                  <option value="jane">Jane Smith</option>
                  <option value="sarah">Sarah Johnson</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNewTaskForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;
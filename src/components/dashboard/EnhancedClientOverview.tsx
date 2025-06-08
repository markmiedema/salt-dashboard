import React from 'react';
import { Users, Building, User, Eye, TrendingUp, AlertCircle } from 'lucide-react';
import { useClients, useClientStats } from '../../hooks/useAdvancedData';

const EnhancedClientOverview: React.FC = () => {
  const { clients, loading: clientsLoading } = useClients();
  const { data: stats, loading: statsLoading } = useClientStats();

  const loading = clientsLoading || statsLoading;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      label: 'Total Clients', 
      value: stats.total, 
      icon: Users, 
      color: 'blue',
      change: `+${stats.recentlyAdded} this month`
    },
    { 
      label: 'Active Clients', 
      value: stats.active, 
      icon: Eye, 
      color: 'emerald',
      change: `${((stats.active / stats.total) * 100).toFixed(0)}% of total`
    },
    { 
      label: 'Prospects', 
      value: stats.prospects, 
      icon: TrendingUp, 
      color: 'purple',
      change: `${stats.conversionRate.toFixed(0)}% conversion rate`
    },
    { 
      label: 'Businesses', 
      value: stats.businessClients, 
      icon: Building, 
      color: 'orange',
      change: `${stats.individualClients} individuals`
    }
  ];

  const recentClients = clients
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

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

  const getPriorityClients = () => {
    return clients
      .filter(c => c.status === 'prospect')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  };

  const priorityClients = getPriorityClients();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Client Overview</h3>
          <p className="text-sm text-gray-600 mt-1">
            {stats.conversionRate > 0 && (
              <span className="text-emerald-600 font-medium">
                {stats.conversionRate.toFixed(1)}% conversion rate
              </span>
            )}
          </p>
        </div>
      </div>
      
      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className={`inline-flex items-center justify-center w-10 h-10 bg-${stat.color}-100 rounded-lg mb-2`}>
                <Icon className={`w-5 h-5 text-${stat.color}-600`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
              <div className="text-xs text-gray-500">{stat.change}</div>
            </div>
          );
        })}
      </div>

      {/* Priority Prospects Alert */}
      {priorityClients.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-medium text-blue-900">Priority Prospects</h4>
          </div>
          <div className="space-y-2">
            {priorityClients.map((client) => (
              <div key={client.id} className="flex items-center justify-between text-sm">
                <span className="text-blue-800">{client.name}</span>
                <span className="text-blue-600">
                  {Math.ceil((new Date().getTime() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Clients */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Recent Activity</h4>
        <div className="space-y-3">
          {recentClients.map((client) => (
            <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                  client.entity_type === 'business' ? 'bg-purple-500' : 'bg-blue-500'
                }`}>
                  {client.entity_type === 'business' ? <Building className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{client.name}</div>
                  <div className="text-sm text-gray-600">{client.email}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(client.status)}`}>
                  {client.status}
                </span>
                <div className="text-xs text-gray-500">
                  {new Date(client.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{stats.active}</span> active clients generating revenue
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All Clients →
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedClientOverview;
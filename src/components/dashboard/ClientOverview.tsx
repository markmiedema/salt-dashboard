import React from 'react';
import { Users, Building, User, Eye } from 'lucide-react';
import { Client } from '../../types/database';

interface ClientOverviewProps {
  clients: Client[];
  loading: boolean;
}

const ClientOverview: React.FC<ClientOverviewProps> = ({ clients, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeClients = clients.filter((c) => c.status === 'active').length;
  const prospects = clients.filter((c) => c.status === 'prospect').length;
  const businessClients = clients.filter((c) => c.entity_type === 'business').length;
  const individualClients = clients.filter((c) => c.entity_type === 'individual').length;

  const stats = [
    { label: 'Active Clients', value: activeClients, icon: Users, color: 'blue' },
    { label: 'Prospects', value: prospects, icon: Eye, color: 'emerald' },
    { label: 'Businesses', value: businessClients, icon: Building, color: 'purple' },
    { label: 'Individuals', value: individualClients, icon: User, color: 'orange' }
  ];

  const recentClients = clients
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Client Overview</h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <div
                className={`inline-flex items-center justify-center w-10 h-10 bg-${stat.color}-100 rounded-lg mb-2`}
              >
                <Icon className={`w-5 h-5 text-${stat.color}-600`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Clients */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Recent Clients</h4>
        <div className="space-y-3">
          {recentClients.map((client) => (
            <div
              key={client.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                    client.entity_type === 'business' ? 'bg-purple-500' : 'bg-blue-500'
                  }`}
                >
                  {client.entity_type === 'business' ? (
                    <Building className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{client.name}</div>
                  <div className="text-sm text-gray-600">{client.email}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    client.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : client.status === 'prospect'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {client.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientOverview;

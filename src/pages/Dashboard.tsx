import React from 'react';
import { useClients, useProjects, useRevenue } from '../hooks/useSupabase';
import RevenueSummary from '../components/dashboard/RevenueSummary';
import ClientOverview from '../components/dashboard/ClientOverview';
import ProjectPipeline from '../components/dashboard/ProjectPipeline';

const Dashboard: React.FC = () => {
  const { clients, loading: clientsLoading } = useClients();
  const { projects, loading: projectsLoading } = useProjects();
  const { revenue, loading: revenueLoading } = useRevenue();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor your agency's performance and key metrics</p>
      </div>

      <div className="space-y-8">
        {/* Revenue Summary */}
        <RevenueSummary revenue={revenue} loading={revenueLoading} />

        {/* Client and Project Overview */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <ClientOverview clients={clients} loading={clientsLoading} />
          <ProjectPipeline projects={projects} loading={projectsLoading} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
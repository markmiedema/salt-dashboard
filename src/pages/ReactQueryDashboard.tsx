import React from 'react';
import ReactQueryRevenueSummary from '../components/dashboard/ReactQueryRevenueSummary';
import ReactQueryClientOverview from '../components/dashboard/ReactQueryClientOverview';
import ReactQueryProjectPipeline from '../components/dashboard/ReactQueryProjectPipeline';

const ReactQueryDashboard: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tax Agency Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Powered by React Query for optimal data management and performance
        </p>
      </div>

      <div className="space-y-8">
        {/* React Query Revenue Analytics */}
        <ReactQueryRevenueSummary targetMonthly={75000} />

        {/* React Query Client and Project Management */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <ReactQueryClientOverview />
          <ReactQueryProjectPipeline />
        </div>
      </div>
    </div>
  );
};

export default ReactQueryDashboard;
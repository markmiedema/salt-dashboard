import React from 'react';
import EnhancedRevenueSummary from '../components/dashboard/EnhancedRevenueSummary';
import EnhancedClientOverview from '../components/dashboard/EnhancedClientOverview';
import EnhancedProjectPipeline from '../components/dashboard/EnhancedProjectPipeline';

const EnhancedDashboard: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tax Agency Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive insights and real-time analytics for your tax practice
        </p>
      </div>

      <div className="space-y-8">
        {/* Advanced Revenue Analytics with Caching */}
        <EnhancedRevenueSummary targetMonthly={75000} />

        {/* Enhanced Client and Project Management with Optimistic Updates */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <EnhancedClientOverview />
          <EnhancedProjectPipeline />
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
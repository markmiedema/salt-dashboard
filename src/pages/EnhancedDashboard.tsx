import React from 'react';
import AdvancedRevenueSummary from '../components/dashboard/AdvancedRevenueSummary';
import EnhancedClientOverview from '../components/dashboard/EnhancedClientOverview';
import AdvancedProjectPipeline from '../components/dashboard/AdvancedProjectPipeline';

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
        {/* Advanced Revenue Analytics */}
        <AdvancedRevenueSummary targetMonthly={75000} />

        {/* Enhanced Client and Project Management */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <EnhancedClientOverview />
          <AdvancedProjectPipeline />
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  AlertTriangle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { useRevenueSummary, useMonthlyTrends } from '../../hooks/useAdvancedData';

interface AdvancedRevenueSummaryProps {
  targetMonthly?: number;
}

const AdvancedRevenueSummary: React.FC<AdvancedRevenueSummaryProps> = ({
  targetMonthly = 75000
}) => {
  const { data: stats, loading: statsLoading } = useRevenueSummary();
  const { data: trends, loading: trendsLoading } = useMonthlyTrends();

  const loading = statsLoading || trendsLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse h-80 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      title: 'Current Month',
      value: stats.currentMonth,
      change: stats.monthlyGrowth,
      icon: DollarSign,
      color: 'blue',
      target: targetMonthly,
      progress: (stats.currentMonth / targetMonthly) * 100
    },
    {
      title: 'Year to Date',
      value: stats.yearToDate,
      change: stats.yearlyGrowth,
      icon: Calendar,
      color: 'emerald',
      comparison: `vs ${stats.lastYear.toLocaleString()} last year`
    },
    {
      title: 'Monthly Average',
      value: stats.averageMonthly,
      change: ((stats.averageMonthly - stats.lastMonth) / stats.lastMonth) * 100,
      icon: TrendingUp,
      color: 'purple',
      subtitle: 'Rolling 12-month average'
    },
    {
      title: 'Projected Annual',
      value: stats.projectedYearly,
      change: ((stats.projectedYearly - stats.lastYear) / stats.lastYear) * 100,
      icon: Target,
      color: 'orange',
      subtitle: 'Based on current trends'
    }
  ];

  // Prepare chart data with growth indicators
  const chartData = trends.slice(-12).map((trend, index, array) => ({
    ...trend,
    previousMonth: index > 0 ? array[index - 1].total : trend.total,
    growthRate: trend.growth
  }));

  return (
    <div className="space-y-6">
      {/* Enhanced Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const isPositive = metric.change >= 0;
          const TrendIcon = isPositive ? TrendingUp : TrendingDown;

          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${metric.color}-50`}>
                  <Icon className={`w-6 h-6 text-${metric.color}-600`} />
                </div>
                {metric.progress && (
                  <div
                    className={`text-xs px-2 py-1 rounded-full ${
                      metric.progress >= 90
                        ? 'bg-emerald-100 text-emerald-800'
                        : metric.progress >= 70
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {metric.progress.toFixed(0)}% of target
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  ${metric.value.toLocaleString()}
                </p>

                {metric.target && (
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Target: ${metric.target.toLocaleString()}</span>
                      <span>${(metric.target - metric.value).toLocaleString()} remaining</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          metric.progress >= 90
                            ? 'bg-emerald-500'
                            : metric.progress >= 70
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(metric.progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div
                    className={`flex items-center text-sm ${
                      isPositive ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    <TrendIcon className="w-4 h-4 mr-1" />
                    <span className="font-medium">{Math.abs(metric.change).toFixed(1)}%</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {metric.comparison || metric.subtitle || 'vs last period'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Advanced Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trends & Analysis</h3>
            <p className="text-sm text-gray-600 mt-1">Monthly performance with growth indicators</p>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Revenue</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-gray-600">Growth Rate</span>
            </div>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="monthName"
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="revenue"
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <YAxis
                yAxisId="growth"
                orientation="right"
                stroke="#10b981"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value.toFixed(0)}%`}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'Growth Rate') {
                    return [`${value.toFixed(1)}%`, name];
                  }
                  return [`$${value.toLocaleString()}`, name];
                }}
                labelStyle={{ color: '#374151' }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar
                yAxisId="revenue"
                dataKey="total"
                fill="#3b82f6"
                radius={[2, 2, 0, 0]}
                opacity={0.8}
              />
              <Line
                yAxisId="growth"
                type="monotone"
                dataKey="growthRate"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Insights */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {stats.monthlyGrowth > 0 ? '+' : ''}
              {stats.monthlyGrowth.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Monthly Growth</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              ${(stats.projectedYearly / 1000000).toFixed(1)}M
            </div>
            <div className="text-sm text-gray-600">Projected Annual</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {stats.targetProgress.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">Target Achievement</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedRevenueSummary;

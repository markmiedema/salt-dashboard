import React from 'react';
import { TrendingUp, DollarSign, Calendar, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RevenueEntry } from '../../types/database';

interface RevenueSummaryProps {
  revenue: RevenueEntry[];
  loading: boolean;
}

const RevenueSummary: React.FC<RevenueSummaryProps> = ({ revenue, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Calculate metrics
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const currentMonthRevenue = revenue
    .filter(r => r.month === currentMonth && r.year === currentYear)
    .reduce((sum, r) => sum + r.amount, 0);

  const lastMonthRevenue = revenue
    .filter(r => r.month === currentMonth - 1 && r.year === currentYear)
    .reduce((sum, r) => sum + r.amount, 0);

  const yearToDateRevenue = revenue
    .filter(r => r.year === currentYear)
    .reduce((sum, r) => sum + r.amount, 0);

  const monthlyGrowth = lastMonthRevenue > 0 
    ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
    : 0;

  // Chart data
  const chartData = revenue
    .reduce((acc, entry) => {
      const key = `${entry.year}-${entry.month.toString().padStart(2, '0')}`;
      const existing = acc.find(item => item.month === key);
      
      if (existing) {
        existing[entry.type] = (existing[entry.type] || 0) + entry.amount;
        existing.total += entry.amount;
      } else {
        acc.push({
          month: key,
          [entry.type]: entry.amount,
          total: entry.amount,
          monthName: new Date(entry.year, entry.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        });
      }
      return acc;
    }, [] as any[])
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // Last 6 months

  const metrics = [
    {
      title: 'Current Month',
      value: currentMonthRevenue,
      change: monthlyGrowth,
      icon: DollarSign,
      color: 'blue'
    },
    {
      title: 'Year to Date',
      value: yearToDateRevenue,
      change: 15.2, // Mock percentage for demo
      icon: Calendar,
      color: 'emerald'
    },
    {
      title: 'Monthly Target',
      value: 75000,
      change: ((currentMonthRevenue / 75000) * 100) - 100,
      icon: Target,
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const isPositive = metric.change >= 0;
          
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    ${metric.value.toLocaleString()}
                  </p>
                  <div className={`flex items-center mt-2 text-sm ${
                    isPositive ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className={`w-4 h-4 mr-1 ${!isPositive ? 'rotate-180' : ''}`} />
                    <span>{Math.abs(metric.change).toFixed(1)}%</span>
                    <span className="text-gray-500 ml-1">vs last period</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg bg-${metric.color}-50`}>
                  <Icon className={`w-6 h-6 text-${metric.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Tax Returns</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-gray-600">Projects</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">Consulting</span>
            </div>
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="monthName" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `$${value.toLocaleString()}`, 
                  name.charAt(0).toUpperCase() + name.slice(1)
                ]}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="returns" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="project" fill="#10b981" radius={[2, 2, 0, 0]} />
              <Bar dataKey="on_call" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default RevenueSummary;
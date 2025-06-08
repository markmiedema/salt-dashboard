import React, { useState } from 'react';
import { Calendar, TrendingUp, DollarSign, FileText, BarChart3 } from 'lucide-react';
import { useRevenue, useClients, useProjects } from '../hooks/useSupabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ExportButton from '../components/reports/ExportButton';

const Reports: React.FC = () => {
  const { revenue, loading: revenueLoading } = useRevenue();
  const { clients, loading: clientsLoading } = useClients();
  const { projects, loading: projectsLoading } = useProjects();
  const [selectedYear, setSelectedYear] = useState(2024);

  const loading = revenueLoading || clientsLoading || projectsLoading;

  // Calculate yearly revenue trend
  const yearlyRevenue = revenue
    .filter(r => r.year === selectedYear)
    .reduce((acc, entry) => {
      const monthKey = entry.month;
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, total: 0, returns: 0, project: 0, on_call: 0 };
      }
      acc[monthKey].total += entry.amount;
      acc[monthKey][entry.type] += entry.amount;
      return acc;
    }, {} as Record<number, any>);

  const chartData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const data = yearlyRevenue[month] || { month, total: 0, returns: 0, project: 0, on_call: 0 };
    return {
      ...data,
      monthName: new Date(selectedYear, i).toLocaleDateString('en-US', { month: 'short' })
    };
  });

  // Revenue by type for pie chart
  const revenueByType = revenue
    .filter(r => r.year === selectedYear)
    .reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + entry.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(revenueByType).map(([type, amount]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
    value: amount,
    percentage: ((amount / Object.values(revenueByType).reduce((a, b) => a + b, 0)) * 100).toFixed(1)
  }));

  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

  // Key metrics
  const totalRevenue = revenue.filter(r => r.year === selectedYear).reduce((sum, r) => sum + r.amount, 0);
  const activeClientsCount = clients.filter(c => c.status === 'active').length;
  const activeProjectsCount = projects.filter(p => p.status === 'in_progress').length;
  const avgProjectValue = projects.length > 0 
    ? projects.filter(p => p.amount).reduce((sum, p) => sum + (p.amount || 0), 0) / projects.filter(p => p.amount).length 
    : 0;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-80 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive insights into your agency's performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={2024}>2024</option>
            <option value={2023}>2023</option>
          </select>
          <ExportButton
            clients={clients}
            projects={projects}
            revenue={revenue}
            selectedYear={selectedYear}
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue ({selectedYear})</p>
              <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
              <div className="flex items-center mt-2 text-sm text-emerald-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>12.5%</span>
                <span className="text-gray-500 ml-1">vs last year</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Clients</p>
              <p className="text-2xl font-bold text-gray-900">{activeClientsCount}</p>
              <div className="flex items-center mt-2 text-sm text-emerald-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>8.2%</span>
                <span className="text-gray-500 ml-1">growth</span>
              </div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">{activeProjectsCount}</p>
              <div className="flex items-center mt-2 text-sm text-blue-600">
                <FileText className="w-4 h-4 mr-1" />
                <span>{projects.filter(p => p.status === 'completed').length}</span>
                <span className="text-gray-500 ml-1">completed</span>
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Project Value</p>
              <p className="text-2xl font-bold text-gray-900">${avgProjectValue.toLocaleString()}</p>
              <div className="flex items-center mt-2 text-sm text-orange-600">
                <BarChart3 className="w-4 h-4 mr-1" />
                <span>15.3%</span>
                <span className="text-gray-500 ml-1">increase</span>
              </div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue Trend</h3>
            <div className="text-sm text-gray-600">
              Total: ${totalRevenue.toLocaleString()}
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
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue by Service Type</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Month</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Returns</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Projects</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Consulting</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {chartData.filter(d => d.total > 0).map((month) => (
                  <tr key={month.month} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">{month.monthName}</td>
                    <td className="py-3 px-4 text-right">${month.returns.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">${month.project.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">${month.on_call.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-semibold">${month.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Clients by Revenue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Client Performance</h3>
          <div className="space-y-4">
            {clients.slice(0, 5).map((client, index) => {
              const clientProjects = projects.filter(p => p.client_id === client.id);
              const totalValue = clientProjects.reduce((sum, p) => sum + (p.amount || 0), 0);
              
              return (
                <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-600">{clientProjects.length} project{clientProjects.length !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">${totalValue.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">{client.status}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Export Information */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Export Options</h4>
            <p className="text-sm text-blue-700 mt-1">
              Export comprehensive reports in PDF format for presentations or Excel format for detailed data analysis. 
              Reports include all metrics, charts, and detailed breakdowns for the selected year.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
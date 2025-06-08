import { supabase } from './supabase';
import { RevenueEntry } from '../types/database';

export interface RevenueStats {
  currentMonth: number;
  lastMonth: number;
  yearToDate: number;
  lastYear: number;
  monthlyGrowth: number;
  yearlyGrowth: number;
  averageMonthly: number;
  projectedYearly: number;
  targetProgress: number;
}

export interface RevenueByType {
  returns: number;
  project: number;
  on_call: number;
}

export interface MonthlyRevenue {
  month: number;
  year: number;
  monthName: string;
  total: number;
  returns: number;
  project: number;
  on_call: number;
  growth: number;
}

export interface RevenueFilters {
  year?: number;
  month?: number;
  type?: RevenueEntry['type'];
  clientId?: string;
  projectId?: string;
}

export class RevenueService {
  static async getAll(filters?: RevenueFilters): Promise<RevenueEntry[]> {
    let query = supabase
      .from('revenue_entries')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (filters?.year) {
      query = query.eq('year', filters.year);
    }

    if (filters?.month) {
      query = query.eq('month', filters.month);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }

    if (filters?.projectId) {
      query = query.eq('project_id', filters.projectId);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching revenue:', error);
      throw new Error(`Failed to fetch revenue: ${error.message}`);
    }

    return data || [];
  }

  static async create(revenue: Omit<RevenueEntry, 'id' | 'created_at'>): Promise<RevenueEntry> {
    const { data, error } = await supabase
      .from('revenue_entries')
      .insert([{
        ...revenue,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create revenue entry: ${error.message}`);
    }

    return data;
  }

  static async update(id: string, updates: Partial<RevenueEntry>): Promise<RevenueEntry> {
    const { data, error } = await supabase
      .from('revenue_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update revenue entry: ${error.message}`);
    }

    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('revenue_entries')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete revenue entry: ${error.message}`);
    }
  }

  static async getStats(targetMonthly: number = 75000): Promise<RevenueStats> {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const allRevenue = await this.getAll();

    const currentMonthRevenue = allRevenue
      .filter(r => r.month === currentMonth && r.year === currentYear)
      .reduce((sum, r) => sum + r.amount, 0);

    const lastMonthRevenue = allRevenue
      .filter(r => r.month === lastMonth && r.year === lastMonthYear)
      .reduce((sum, r) => sum + r.amount, 0);

    const yearToDateRevenue = allRevenue
      .filter(r => r.year === currentYear)
      .reduce((sum, r) => sum + r.amount, 0);

    const lastYearRevenue = allRevenue
      .filter(r => r.year === currentYear - 1)
      .reduce((sum, r) => sum + r.amount, 0);

    const monthlyGrowth = lastMonthRevenue > 0 
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    const yearlyGrowth = lastYearRevenue > 0 
      ? ((yearToDateRevenue - lastYearRevenue) / lastYearRevenue) * 100 
      : 0;

    const monthsWithRevenue = allRevenue
      .filter(r => r.year === currentYear)
      .reduce((acc, r) => {
        const key = r.month;
        acc[key] = (acc[key] || 0) + r.amount;
        return acc;
      }, {} as Record<number, number>);

    const averageMonthly = Object.keys(monthsWithRevenue).length > 0 
      ? Object.values(monthsWithRevenue).reduce((sum, val) => sum + val, 0) / Object.keys(monthsWithRevenue).length
      : 0;

    const projectedYearly = averageMonthly * 12;
    const targetProgress = targetMonthly > 0 ? (currentMonthRevenue / targetMonthly) * 100 : 0;

    return {
      currentMonth: currentMonthRevenue,
      lastMonth: lastMonthRevenue,
      yearToDate: yearToDateRevenue,
      lastYear: lastYearRevenue,
      monthlyGrowth,
      yearlyGrowth,
      averageMonthly,
      projectedYearly,
      targetProgress
    };
  }

  static async getRevenueByType(year?: number): Promise<RevenueByType> {
    const currentYear = year || new Date().getFullYear();
    const revenue = await this.getAll({ year: currentYear });

    return revenue.reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + entry.amount;
      return acc;
    }, { returns: 0, project: 0, on_call: 0 } as RevenueByType);
  }

  static async getMonthlyTrends(year?: number, months: number = 12): Promise<MonthlyRevenue[]> {
    const currentYear = year || new Date().getFullYear();
    const revenue = await this.getAll();

    // Get data for current year and previous year for growth calculation
    const currentYearData = revenue.filter(r => r.year === currentYear);
    const previousYearData = revenue.filter(r => r.year === currentYear - 1);

    const monthlyData: MonthlyRevenue[] = [];

    for (let i = 0; i < months; i++) {
      const month = i + 1;
      const monthRevenue = currentYearData.filter(r => r.month === month);
      const previousYearMonth = previousYearData.filter(r => r.month === month);

      const total = monthRevenue.reduce((sum, r) => sum + r.amount, 0);
      const previousTotal = previousYearMonth.reduce((sum, r) => sum + r.amount, 0);
      const growth = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;

      const monthData: MonthlyRevenue = {
        month,
        year: currentYear,
        monthName: new Date(currentYear, month - 1).toLocaleDateString('en-US', { month: 'short' }),
        total,
        returns: monthRevenue.filter(r => r.type === 'returns').reduce((sum, r) => sum + r.amount, 0),
        project: monthRevenue.filter(r => r.type === 'project').reduce((sum, r) => sum + r.amount, 0),
        on_call: monthRevenue.filter(r => r.type === 'on_call').reduce((sum, r) => sum + r.amount, 0),
        growth
      };

      monthlyData.push(monthData);
    }

    return monthlyData;
  }

  static async getForecast(months: number = 6): Promise<MonthlyRevenue[]> {
    const trends = await this.getMonthlyTrends();
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Calculate average growth rate from last 6 months
    const recentTrends = trends.slice(-6);
    const averageGrowth = recentTrends.reduce((sum, t) => sum + t.growth, 0) / recentTrends.length;
    const averageMonthly = recentTrends.reduce((sum, t) => sum + t.total, 0) / recentTrends.length;

    const forecast: MonthlyRevenue[] = [];

    for (let i = 1; i <= months; i++) {
      const forecastMonth = currentMonth + i;
      const forecastYear = forecastMonth > 12 ? currentYear + 1 : currentYear;
      const adjustedMonth = forecastMonth > 12 ? forecastMonth - 12 : forecastMonth;

      const projectedTotal = averageMonthly * (1 + (averageGrowth / 100));

      forecast.push({
        month: adjustedMonth,
        year: forecastYear,
        monthName: new Date(forecastYear, adjustedMonth - 1).toLocaleDateString('en-US', { month: 'short' }),
        total: projectedTotal,
        returns: projectedTotal * 0.6, // Estimated distribution
        project: projectedTotal * 0.3,
        on_call: projectedTotal * 0.1,
        growth: averageGrowth
      });
    }

    return forecast;
  }
}
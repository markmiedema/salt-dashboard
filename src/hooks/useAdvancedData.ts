import { useState, useEffect, useCallback } from 'react';
import { ClientService, ClientStats, ClientFilters, PaginatedResponse } from '../services/clientService';
import { ProjectService, ProjectStats, ProjectFilters } from '../services/projectService';
import { RevenueService, RevenueStats, MonthlyRevenue, RevenueByType } from '../services/revenueService';
import { Client, Project, RevenueEntry } from '../types/database';
import { MockDataService } from '../services/supabase';
import { useDebounce } from './useDebounce';
import { usePagination } from './usePagination';

interface UseDataResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UsePaginatedDataResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  refetch: () => Promise<void>;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setLimit: (limit: number) => void;
}

export function useClients(filters?: Omit<ClientFilters, 'page' | 'limit'>) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { pagination, goToPage, nextPage, prevPage, setLimit, setTotal } = usePagination(20);

  // Debounce search term to avoid excessive API calls
  const debouncedSearch = useDebounce(filters?.search || '', 300);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ClientService.getAll({
        ...filters,
        search: debouncedSearch,
        page: pagination.page,
        limit: pagination.limit
      });
      
      setClients(result.data);
      setTotal(result.total);
    } catch (err) {
      console.log('Using mock client data - Supabase error:', err);
      // Fallback to mock data with simulated pagination
      const mockData = MockDataService.mockClients;
      const filteredData = mockData.filter(client => {
        if (filters?.status && client.status !== filters.status) return false;
        if (filters?.entityType && client.entity_type !== filters.entityType) return false;
        if (debouncedSearch && !client.name.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
        return true;
      });
      
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      setClients(filteredData.slice(startIndex, endIndex));
      setTotal(filteredData.length);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch, pagination.page, pagination.limit, setTotal]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const addClient = async (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newClient = await ClientService.create(client);
      await fetchClients(); // Refresh the list
      return newClient;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add client');
      throw err;
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      const updatedClient = await ClientService.update(id, updates);
      await fetchClients(); // Refresh the list
      return updatedClient;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update client');
      throw err;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      await ClientService.delete(id);
      await fetchClients(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete client');
      throw err;
    }
  };

  return {
    clients,
    loading,
    error,
    pagination,
    addClient,
    updateClient,
    deleteClient,
    refetch: fetchClients,
    goToPage,
    nextPage,
    prevPage,
    setLimit
  };
}

export function useProjects(filters?: Omit<ProjectFilters, 'page' | 'limit'>) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { pagination, goToPage, nextPage, prevPage, setLimit, setTotal } = usePagination(20);

  // Debounce search term
  const debouncedSearch = useDebounce(filters?.search || '', 300);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ProjectService.getAll({
        ...filters,
        search: debouncedSearch,
        page: pagination.page,
        limit: pagination.limit
      });
      
      setProjects(result.data);
      setTotal(result.total);
    } catch (err) {
      console.log('Using mock project data - Supabase error:', err);
      // Fallback to mock data with simulated pagination
      const mockData = MockDataService.mockProjects;
      const filteredData = mockData.filter(project => {
        if (filters?.status && project.status !== filters.status) return false;
        if (filters?.type && project.type !== filters.type) return false;
        if (filters?.clientId && project.client_id !== filters.clientId) return false;
        if (debouncedSearch && !project.name.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
        return true;
      });
      
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      setProjects(filteredData.slice(startIndex, endIndex));
      setTotal(filteredData.length);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch, pagination.page, pagination.limit, setTotal]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newProject = await ProjectService.create(project);
      await fetchProjects(); // Refresh the list
      return newProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add project');
      throw err;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const updatedProject = await ProjectService.update(id, updates);
      await fetchProjects(); // Refresh the list
      return updatedProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await ProjectService.delete(id);
      await fetchProjects(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      throw err;
    }
  };

  const updateProgress = async (id: string, actualHours: number) => {
    return updateProject(id, { actual_hours: actualHours });
  };

  return {
    projects,
    loading,
    error,
    pagination,
    addProject,
    updateProject,
    updateProgress,
    deleteProject,
    refetch: fetchProjects,
    goToPage,
    nextPage,
    prevPage,
    setLimit
  };
}

export function useRevenue() {
  const [revenue, setRevenue] = useState<RevenueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await RevenueService.getAll();
      setRevenue(data);
    } catch (err) {
      console.log('Using mock revenue data - Supabase error:', err);
      setRevenue(MockDataService.mockRevenue);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, []);

  const addRevenue = async (revenueEntry: Omit<RevenueEntry, 'id' | 'created_at'>) => {
    try {
      const newEntry = await RevenueService.create(revenueEntry);
      setRevenue(prev => [newEntry, ...prev]);
      return newEntry;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add revenue entry');
      throw err;
    }
  };

  return {
    revenue,
    loading,
    error,
    addRevenue,
    refetch: fetchRevenue
  };
}

export function useClientStats(): UseDataResult<ClientStats> {
  const [data, setData] = useState<ClientStats>({
    total: 0,
    active: 0,
    prospects: 0,
    inactive: 0,
    businessClients: 0,
    individualClients: 0,
    recentlyAdded: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await ClientService.getStats();
      setData(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch client stats');
      // Fallback to basic calculation from mock data
      const clients = MockDataService.mockClients;
      setData({
        total: clients.length,
        active: clients.filter(c => c.status === 'active').length,
        prospects: clients.filter(c => c.status === 'prospect').length,
        inactive: clients.filter(c => c.status === 'inactive').length,
        businessClients: clients.filter(c => c.entity_type === 'business').length,
        individualClients: clients.filter(c => c.entity_type === 'individual').length,
        recentlyAdded: 1,
        conversionRate: 75
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { data, loading, error, refetch: fetchStats };
}

export function useProjectStats(): UseDataResult<ProjectStats> {
  const [data, setData] = useState<ProjectStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    onHold: 0,
    overdue: 0,
    totalValue: 0,
    averageValue: 0,
    completionRate: 0,
    averageHours: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await ProjectService.getStats();
      setData(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch project stats');
      // Fallback calculation
      const projects = MockDataService.mockProjects;
      const totalValue = projects.reduce((sum, p) => sum + (p.amount || 0), 0);
      setData({
        total: projects.length,
        pending: projects.filter(p => p.status === 'pending').length,
        inProgress: projects.filter(p => p.status === 'in_progress').length,
        completed: projects.filter(p => p.status === 'completed').length,
        onHold: projects.filter(p => p.status === 'on_hold').length,
        overdue: 0,
        totalValue,
        averageValue: totalValue / projects.length,
        completionRate: 33,
        averageHours: 15
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { data, loading, error, refetch: fetchStats };
}

export function useRevenueSummary(): UseDataResult<RevenueStats> {
  const [data, setData] = useState<RevenueStats>({
    currentMonth: 0,
    lastMonth: 0,
    yearToDate: 0,
    lastYear: 0,
    monthlyGrowth: 0,
    yearlyGrowth: 0,
    averageMonthly: 0,
    projectedYearly: 0,
    targetProgress: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await RevenueService.getStats();
      setData(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch revenue stats');
      // Fallback calculation
      setData({
        currentMonth: 71500,
        lastMonth: 65000,
        yearToDate: 215000,
        lastYear: 180000,
        monthlyGrowth: 10,
        yearlyGrowth: 19.4,
        averageMonthly: 71666,
        projectedYearly: 860000,
        targetProgress: 95.3
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { data, loading, error, refetch: fetchStats };
}

export function useMonthlyTrends(year?: number): UseDataResult<MonthlyRevenue[]> {
  const [data, setData] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      setError(null);
      const trends = await RevenueService.getMonthlyTrends(year);
      setData(trends);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch revenue trends');
      // Fallback data
      setData([
        { month: 1, year: 2024, monthName: 'Jan', total: 71500, returns: 45000, project: 18000, on_call: 8500, growth: 8.5 },
        { month: 2, year: 2024, monthName: 'Feb', total: 64000, returns: 52000, project: 12000, on_call: 0, growth: -10.5 },
        { month: 3, year: 2024, monthName: 'Mar', total: 53000, returns: 38000, project: 0, on_call: 15000, growth: -17.2 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [year]);

  return { data, loading, error, refetch: fetchTrends };
}

export function useRevenueByType(year?: number): UseDataResult<RevenueByType> {
  const [data, setData] = useState<RevenueByType>({ returns: 0, project: 0, on_call: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchByType = async () => {
    try {
      setLoading(true);
      setError(null);
      const byType = await RevenueService.getRevenueByType(year);
      setData(byType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch revenue by type');
      setData({ returns: 135000, project: 30000, on_call: 23500 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchByType();
  }, [year]);

  return { data, loading, error, refetch: fetchByType };
}
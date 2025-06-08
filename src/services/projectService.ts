import { supabase } from './supabase';
import { Project } from '../types/database';

export interface ProjectStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  onHold: number;
  overdue: number;
  totalValue: number;
  averageValue: number;
  completionRate: number;
  averageHours: number;
}

export interface ProjectFilters {
  status?: Project['status'];
  type?: Project['type'];
  clientId?: string;
  search?: string;
  overdue?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ProjectService {
  static async getAll(filters?: ProjectFilters): Promise<PaginatedResponse<Project>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    // Build the query with filters
    let query = supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }

    if (filters?.search && filters.search.trim()) {
      query = query.ilike('name', `%${filters.search.trim()}%`);
    }

    // Handle overdue filter (projects past due date and not completed)
    if (filters?.overdue) {
      const today = new Date().toISOString().split('T')[0];
      query = query
        .lt('due_date', today)
        .neq('status', 'completed');
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching projects:', error);
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data || [],
      total,
      page,
      limit,
      totalPages
    };
  }

  static async getById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch project: ${error.message}`);
    }

    return data;
  }

  static async create(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        ...project,
        actual_hours: project.actual_hours || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }

    return data;
  }

  static async update(id: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }

    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  static async updateProgress(id: string, actualHours: number): Promise<Project> {
    return this.update(id, { actual_hours: actualHours });
  }

  static async getStats(): Promise<ProjectStats> {
    // Get counts using database aggregation
    const [totalResult, pendingResult, inProgressResult, completedResult, onHoldResult] = await Promise.all([
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'on_hold')
    ]);

    // Get overdue projects count
    const today = new Date().toISOString().split('T')[0];
    const { count: overdueCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .lt('due_date', today)
      .neq('status', 'completed');

    // Get aggregated values for projects with amounts
    const { data: projectsWithValues } = await supabase
      .from('projects')
      .select('amount, actual_hours')
      .not('amount', 'is', null);

    const totalValue = projectsWithValues?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const averageValue = projectsWithValues && projectsWithValues.length > 0 
      ? totalValue / projectsWithValues.length 
      : 0;

    const totalHours = projectsWithValues?.reduce((sum, p) => sum + p.actual_hours, 0) || 0;
    const averageHours = projectsWithValues && projectsWithValues.length > 0 
      ? totalHours / projectsWithValues.length 
      : 0;

    const total = totalResult.count || 0;
    const completed = completedResult.count || 0;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      pending: pendingResult.count || 0,
      inProgress: inProgressResult.count || 0,
      completed,
      onHold: onHoldResult.count || 0,
      overdue: overdueCount || 0,
      totalValue,
      averageValue,
      completionRate,
      averageHours
    };
  }

  static getDaysUntilDue(dueDate: string | null): number | null {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  static getProjectPriority(project: Project): 'high' | 'medium' | 'low' {
    const daysUntilDue = this.getDaysUntilDue(project.due_date);
    
    if (daysUntilDue !== null && daysUntilDue < 0) return 'high'; // Overdue
    if (daysUntilDue !== null && daysUntilDue <= 7) return 'high'; // Due within a week
    if (daysUntilDue !== null && daysUntilDue <= 14) return 'medium'; // Due within two weeks
    
    return 'low';
  }

  static async getOverdueProjects(limit?: number): Promise<Project[]> {
    const result = await this.getAll({ overdue: true, limit });
    return result.data;
  }

  static async getProjectsByClient(clientId: string, limit?: number): Promise<Project[]> {
    const result = await this.getAll({ clientId, limit });
    return result.data;
  }

  static async searchProjects(searchTerm: string, limit: number = 10): Promise<Project[]> {
    if (!searchTerm.trim()) return [];

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .ilike('name', `%${searchTerm.trim()}%`)
      .order('name')
      .limit(limit);

    if (error) {
      throw new Error(`Failed to search projects: ${error.message}`);
    }

    return data || [];
  }
}
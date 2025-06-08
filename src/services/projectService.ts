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
}

export class ProjectService {
  static async getAll(filters?: ProjectFilters): Promise<Project[]> {
    let query = supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching projects:', error);
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    let projects = data || [];

    // Filter overdue projects if requested
    if (filters?.overdue) {
      const today = new Date();
      projects = projects.filter(p => 
        p.due_date && 
        new Date(p.due_date) < today && 
        p.status !== 'completed'
      );
    }

    return projects;
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
    const projects = await this.getAll();
    const today = new Date();

    const overdue = projects.filter(p => 
      p.due_date && 
      new Date(p.due_date) < today && 
      p.status !== 'completed'
    ).length;

    const projectsWithValue = projects.filter(p => p.amount && p.amount > 0);
    const totalValue = projectsWithValue.reduce((sum, p) => sum + (p.amount || 0), 0);
    const averageValue = projectsWithValue.length > 0 ? totalValue / projectsWithValue.length : 0;

    const projectsWithHours = projects.filter(p => p.actual_hours > 0);
    const totalHours = projectsWithHours.reduce((sum, p) => sum + p.actual_hours, 0);
    const averageHours = projectsWithHours.length > 0 ? totalHours / projectsWithHours.length : 0;

    const completed = projects.filter(p => p.status === 'completed').length;
    const completionRate = projects.length > 0 ? (completed / projects.length) * 100 : 0;

    return {
      total: projects.length,
      pending: projects.filter(p => p.status === 'pending').length,
      inProgress: projects.filter(p => p.status === 'in_progress').length,
      completed,
      onHold: projects.filter(p => p.status === 'on_hold').length,
      overdue,
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

  static async getOverdueProjects(): Promise<Project[]> {
    return this.getAll({ overdue: true });
  }

  static async getProjectsByClient(clientId: string): Promise<Project[]> {
    return this.getAll({ clientId });
  }
}
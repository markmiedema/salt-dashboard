import { supabase } from './supabase';
import { Client } from '../types/database';

export interface ClientStats {
  total: number;
  active: number;
  prospects: number;
  inactive: number;
  businessClients: number;
  individualClients: number;
  recentlyAdded: number;
  conversionRate: number;
}

export interface ClientFilters {
  status?: Client['status'];
  entityType?: Client['entity_type'];
  search?: string;
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

export class ClientService {
  static async getAll(filters?: ClientFilters): Promise<PaginatedResponse<Client>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    // Build the query with filters
    let query = supabase
      .from('clients')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }

    if (filters?.search && filters.search.trim()) {
      const searchTerm = filters.search.trim();
      query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching clients:', error);
      throw new Error(`Failed to fetch clients: ${error.message}`);
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

  static async getById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch client: ${error.message}`);
    }

    return data;
  }

  static async create(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .insert([{
        ...client,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create client: ${error.message}`);
    }

    return data;
  }

  static async update(id: string, updates: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update client: ${error.message}`);
    }

    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete client: ${error.message}`);
    }
  }

  static async getStats(): Promise<ClientStats> {
    // Get total counts with filters
    const [totalResult, activeResult, prospectResult, inactiveResult, businessResult, individualResult] = await Promise.all([
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'prospect'),
      supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'inactive'),
      supabase.from('clients').select('*', { count: 'exact', head: true }).eq('entity_type', 'business'),
      supabase.from('clients').select('*', { count: 'exact', head: true }).eq('entity_type', 'individual')
    ]);

    // Get recently added clients (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count: recentCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    const stats: ClientStats = {
      total: totalResult.count || 0,
      active: activeResult.count || 0,
      prospects: prospectResult.count || 0,
      inactive: inactiveResult.count || 0,
      businessClients: businessResult.count || 0,
      individualClients: individualResult.count || 0,
      recentlyAdded: recentCount || 0,
      conversionRate: 0
    };

    // Calculate conversion rate (prospects converted to active in last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const { count: convertedCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('updated_at', ninetyDaysAgo.toISOString())
      .lt('created_at', ninetyDaysAgo.toISOString());

    const totalProspects = stats.prospects + (convertedCount || 0);
    stats.conversionRate = totalProspects > 0 ? ((convertedCount || 0) / totalProspects) * 100 : 0;

    return stats;
  }

  static async getTopClientsByRevenue(limit: number = 5): Promise<Array<Client & { totalRevenue: number; projectCount: number }>> {
    // This would typically be done with a JOIN query, but we'll simulate it
    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .limit(limit * 2); // Get more to account for filtering

    const { data: projects } = await supabase
      .from('projects')
      .select('client_id, amount');

    if (!clients || !projects) return [];

    const clientRevenue = clients.map(client => {
      const clientProjects = projects.filter(p => p.client_id === client.id);
      const totalRevenue = clientProjects.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      return {
        ...client,
        totalRevenue,
        projectCount: clientProjects.length
      };
    });

    return clientRevenue
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }

  static async searchClients(searchTerm: string, limit: number = 10): Promise<Client[]> {
    if (!searchTerm.trim()) return [];

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('name')
      .limit(limit);

    if (error) {
      throw new Error(`Failed to search clients: ${error.message}`);
    }

    return data || [];
  }
}
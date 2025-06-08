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
}

export class ClientService {
  static async getAll(filters?: ClientFilters): Promise<Client[]> {
    let query = supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching clients:', error);
      throw new Error(`Failed to fetch clients: ${error.message}`);
    }

    return data || [];
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
    const clients = await this.getAll();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats: ClientStats = {
      total: clients.length,
      active: clients.filter(c => c.status === 'active').length,
      prospects: clients.filter(c => c.status === 'prospect').length,
      inactive: clients.filter(c => c.status === 'inactive').length,
      businessClients: clients.filter(c => c.entity_type === 'business').length,
      individualClients: clients.filter(c => c.entity_type === 'individual').length,
      recentlyAdded: clients.filter(c => new Date(c.created_at) > thirtyDaysAgo).length,
      conversionRate: 0
    };

    // Calculate conversion rate (prospects converted to active in last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const recentlyConverted = clients.filter(c => 
      c.status === 'active' && 
      new Date(c.updated_at) > ninetyDaysAgo &&
      new Date(c.created_at) < ninetyDaysAgo
    ).length;

    const totalProspects = stats.prospects + recentlyConverted;
    stats.conversionRate = totalProspects > 0 ? (recentlyConverted / totalProspects) * 100 : 0;

    return stats;
  }

  static async getTopClientsByRevenue(limit: number = 5): Promise<Array<Client & { totalRevenue: number; projectCount: number }>> {
    // This would typically be done with a JOIN query, but we'll simulate it
    const clients = await this.getAll();
    const { data: projects } = await supabase
      .from('projects')
      .select('client_id, amount');

    const clientRevenue = clients.map(client => {
      const clientProjects = projects?.filter(p => p.client_id === client.id) || [];
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
}
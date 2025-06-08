import { useState, useEffect } from 'react';
import { supabase, MockDataService } from '../services/supabase';
import { Client, Project, RevenueEntry } from '../types/database';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      
      // Try Supabase first, fallback to mock data
      const { data, error: supabaseError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        console.log('Using mock data - Supabase not configured');
        setClients(MockDataService.mockClients);
      } else {
        setClients(data || []);
      }
    } catch (err) {
      console.log('Using mock data - connection failed');
      setClients(MockDataService.mockClients);
    } finally {
      setLoading(false);
    }
  };

  const addClient = async (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([client])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setClients(prev => [data, ...prev]);
      }
      return data;
    } catch (err) {
      console.error('Failed to add client:', err);
      throw err;
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setClients(prev => prev.map(client => 
          client.id === id ? data : client
        ));
      }
      return data;
    } catch (err) {
      console.error('Failed to update client:', err);
      throw err;
    }
  };

  return {
    clients,
    loading,
    error,
    addClient,
    updateClient,
    refetch: fetchClients
  };
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Using mock project data');
        setProjects(MockDataService.mockProjects);
      } else {
        setProjects(data || []);
      }
    } catch (err) {
      console.log('Using mock project data');
      setProjects(MockDataService.mockProjects);
    } finally {
      setLoading(false);
    }
  };

  return {
    projects,
    loading,
    refetch: fetchProjects
  };
}

export function useRevenue() {
  const [revenue, setRevenue] = useState<RevenueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenue();
  }, []);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('revenue_entries')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) {
        console.log('Using mock revenue data');
        setRevenue(MockDataService.mockRevenue);
      } else {
        setRevenue(data || []);
      }
    } catch (err) {
      console.log('Using mock revenue data');
      setRevenue(MockDataService.mockRevenue);
    } finally {
      setLoading(false);
    }
  };

  return {
    revenue,
    loading,
    refetch: fetchRevenue
  };
}
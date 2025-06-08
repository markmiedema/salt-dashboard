import { useCallback } from 'react';
import { useDataCache } from './useDataCache';
import { useOptimisticUpdate } from './useOptimisticUpdate';
import { ClientService, ClientStats } from '../services/clientService';
import { ProjectService, ProjectStats } from '../services/projectService';
import { RevenueService, RevenueStats, MonthlyRevenue, RevenueByType } from '../services/revenueService';
import { Client, Project, RevenueEntry } from '../types/database';

// Enhanced Clients Hook with Caching and Optimistic Updates
export function useEnhancedClients() {
  const {
    data: clients,
    loading,
    error,
    refresh,
    mutate,
    isStale
  } = useDataCache<Client[]>(
    'clients',
    () => ClientService.getAll(),
    { ttl: 2 * 60 * 1000 } // 2 minutes cache
  );

  const { update: optimisticUpdate, isUpdating } = useOptimisticUpdate<Client>(
    async (client: Client) => {
      if (client.id) {
        return await ClientService.update(client.id, client);
      }
      throw new Error('Client ID is required for update');
    },
    (updatedClient) => {
      // Update cache with successful result
      mutate(prevClients => 
        prevClients ? prevClients.map(c => c.id === updatedClient.id ? updatedClient : c) : [updatedClient]
      );
    },
    (error) => {
      console.error('Failed to update client:', error);
    }
  );

  const addClient = useCallback(async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newClient = await ClientService.create(clientData);
      mutate(prevClients => prevClients ? [newClient, ...prevClients] : [newClient]);
      return newClient;
    } catch (error) {
      console.error('Failed to add client:', error);
      throw error;
    }
  }, [mutate]);

  const updateClient = useCallback(async (id: string, updates: Partial<Client>) => {
    const currentClient = clients?.find(c => c.id === id);
    if (!currentClient) throw new Error('Client not found');

    const optimisticClient = { ...currentClient, ...updates };
    
    // Optimistically update the UI
    mutate(prevClients => 
      prevClients ? prevClients.map(c => c.id === id ? optimisticClient : c) : [optimisticClient]
    );

    // Perform the actual update with rollback on failure
    await optimisticUpdate(optimisticClient, () => {
      // Rollback function
      mutate(prevClients => 
        prevClients ? prevClients.map(c => c.id === id ? currentClient : c) : [currentClient]
      );
    });
  }, [clients, mutate, optimisticUpdate]);

  const deleteClient = useCallback(async (id: string) => {
    const clientToDelete = clients?.find(c => c.id === id);
    if (!clientToDelete) throw new Error('Client not found');

    // Optimistically remove from UI
    mutate(prevClients => prevClients ? prevClients.filter(c => c.id !== id) : []);

    try {
      await ClientService.delete(id);
    } catch (error) {
      // Rollback on failure
      mutate(prevClients => prevClients ? [...prevClients, clientToDelete] : [clientToDelete]);
      throw error;
    }
  }, [clients, mutate]);

  return {
    clients: clients || [],
    loading,
    error,
    isStale,
    isUpdating,
    addClient,
    updateClient,
    deleteClient,
    refresh
  };
}

// Enhanced Projects Hook with Caching and Optimistic Updates
export function useEnhancedProjects() {
  const {
    data: projects,
    loading,
    error,
    refresh,
    mutate,
    isStale
  } = useDataCache<Project[]>(
    'projects',
    () => ProjectService.getAll(),
    { ttl: 2 * 60 * 1000 }
  );

  const { update: optimisticUpdate, isUpdating } = useOptimisticUpdate<Project>(
    async (project: Project) => {
      if (project.id) {
        return await ProjectService.update(project.id, project);
      }
      throw new Error('Project ID is required for update');
    },
    (updatedProject) => {
      mutate(prevProjects => 
        prevProjects ? prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p) : [updatedProject]
      );
    }
  );

  const addProject = useCallback(async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newProject = await ProjectService.create(projectData);
      mutate(prevProjects => prevProjects ? [newProject, ...prevProjects] : [newProject]);
      return newProject;
    } catch (error) {
      console.error('Failed to add project:', error);
      throw error;
    }
  }, [mutate]);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    const currentProject = projects?.find(p => p.id === id);
    if (!currentProject) throw new Error('Project not found');

    const optimisticProject = { ...currentProject, ...updates };
    
    mutate(prevProjects => 
      prevProjects ? prevProjects.map(p => p.id === id ? optimisticProject : p) : [optimisticProject]
    );

    await optimisticUpdate(optimisticProject, () => {
      mutate(prevProjects => 
        prevProjects ? prevProjects.map(p => p.id === id ? currentProject : p) : [currentProject]
      );
    });
  }, [projects, mutate, optimisticUpdate]);

  const updateProgress = useCallback(async (id: string, actualHours: number) => {
    return updateProject(id, { actual_hours: actualHours });
  }, [updateProject]);

  return {
    projects: projects || [],
    loading,
    error,
    isStale,
    isUpdating,
    addProject,
    updateProject,
    updateProgress,
    refresh
  };
}

// Enhanced Revenue Hook with Caching
export function useEnhancedRevenue() {
  const {
    data: revenue,
    loading,
    error,
    refresh,
    mutate,
    isStale
  } = useDataCache<RevenueEntry[]>(
    'revenue',
    () => RevenueService.getAll(),
    { ttl: 5 * 60 * 1000 } // 5 minutes cache for revenue data
  );

  const addRevenue = useCallback(async (revenueData: Omit<RevenueEntry, 'id' | 'created_at'>) => {
    try {
      const newEntry = await RevenueService.create(revenueData);
      mutate(prevRevenue => prevRevenue ? [newEntry, ...prevRevenue] : [newEntry]);
      return newEntry;
    } catch (error) {
      console.error('Failed to add revenue entry:', error);
      throw error;
    }
  }, [mutate]);

  return {
    revenue: revenue || [],
    loading,
    error,
    isStale,
    addRevenue,
    refresh
  };
}

// Enhanced Stats Hooks with Caching
export function useEnhancedClientStats() {
  return useDataCache<ClientStats>(
    'client-stats',
    () => ClientService.getStats(),
    { ttl: 3 * 60 * 1000 } // 3 minutes cache
  );
}

export function useEnhancedProjectStats() {
  return useDataCache<ProjectStats>(
    'project-stats',
    () => ProjectService.getStats(),
    { ttl: 3 * 60 * 1000 }
  );
}

export function useEnhancedRevenueSummary() {
  return useDataCache<RevenueStats>(
    'revenue-summary',
    () => RevenueService.getStats(),
    { ttl: 5 * 60 * 1000 }
  );
}

export function useEnhancedMonthlyTrends(year?: number) {
  return useDataCache<MonthlyRevenue[]>(
    `monthly-trends-${year || 'current'}`,
    () => RevenueService.getMonthlyTrends(year),
    { ttl: 10 * 60 * 1000 } // 10 minutes cache for trends
  );
}

export function useEnhancedRevenueByType(year?: number) {
  return useDataCache<RevenueByType>(
    `revenue-by-type-${year || 'current'}`,
    () => RevenueService.getRevenueByType(year),
    { ttl: 10 * 60 * 1000 }
  );
}
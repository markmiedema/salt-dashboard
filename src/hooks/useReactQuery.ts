import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { ClientService, ClientStats } from '../services/clientService';
import { ProjectService, ProjectStats } from '../services/projectService';
import { RevenueService, RevenueStats, MonthlyRevenue, RevenueByType } from '../services/revenueService';
import { Client, Project, RevenueEntry } from '../types/database';

// Query Keys - centralized for consistency
export const queryKeys = {
  clients: ['clients'] as const,
  clientStats: ['clients', 'stats'] as const,
  projects: ['projects'] as const,
  projectStats: ['projects', 'stats'] as const,
  revenue: ['revenue'] as const,
  revenueStats: ['revenue', 'stats'] as const,
  monthlyTrends: (year?: number) => ['revenue', 'trends', year] as const,
  revenueByType: (year?: number) => ['revenue', 'by-type', year] as const,
};

// ============================================================================
// CLIENT QUERIES & MUTATIONS
// ============================================================================

export function useClientsQuery(options?: Partial<UseQueryOptions<Client[], Error>>) {
  return useQuery({
    queryKey: queryKeys.clients,
    queryFn: ClientService.getAll,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
}

export function useClientStatsQuery(options?: Partial<UseQueryOptions<ClientStats, Error>>) {
  return useQuery({
    queryKey: queryKeys.clientStats,
    queryFn: ClientService.getStats,
    staleTime: 3 * 60 * 1000, // 3 minutes
    ...options,
  });
}

export function useCreateClientMutation(options?: UseMutationOptions<Client, Error, Omit<Client, 'id' | 'created_at' | 'updated_at'>>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ClientService.create,
    onMutate: async (newClient) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.clients });
      await queryClient.cancelQueries({ queryKey: queryKeys.clientStats });

      // Snapshot previous values
      const previousClients = queryClient.getQueryData<Client[]>(queryKeys.clients);
      const previousStats = queryClient.getQueryData<ClientStats>(queryKeys.clientStats);

      // Optimistically update clients list
      if (previousClients) {
        const optimisticClient: Client = {
          ...newClient,
          id: `temp-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        queryClient.setQueryData<Client[]>(queryKeys.clients, [optimisticClient, ...previousClients]);
      }

      // Optimistically update stats
      if (previousStats) {
        queryClient.setQueryData<ClientStats>(queryKeys.clientStats, {
          ...previousStats,
          total: previousStats.total + 1,
          [newClient.status]: previousStats[newClient.status as keyof ClientStats] + 1,
          [`${newClient.entity_type}Clients`]: (previousStats as any)[`${newClient.entity_type}Clients`] + 1,
        });
      }

      return { previousClients, previousStats };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousClients) {
        queryClient.setQueryData(queryKeys.clients, context.previousClients);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(queryKeys.clientStats, context.previousStats);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      queryClient.invalidateQueries({ queryKey: queryKeys.clientStats });
    },
    ...options,
  });
}

export function useUpdateClientMutation(options?: UseMutationOptions<Client, Error, { id: string; data: Partial<Client> }>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => ClientService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.clients });
      
      const previousClients = queryClient.getQueryData<Client[]>(queryKeys.clients);
      
      if (previousClients) {
        queryClient.setQueryData<Client[]>(queryKeys.clients, 
          previousClients.map(client => 
            client.id === id ? { ...client, ...data, updated_at: new Date().toISOString() } : client
          )
        );
      }

      return { previousClients };
    },
    onError: (err, variables, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(queryKeys.clients, context.previousClients);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      queryClient.invalidateQueries({ queryKey: queryKeys.clientStats });
    },
    ...options,
  });
}

export function useDeleteClientMutation(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ClientService.delete,
    onMutate: async (clientId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.clients });
      
      const previousClients = queryClient.getQueryData<Client[]>(queryKeys.clients);
      
      if (previousClients) {
        queryClient.setQueryData<Client[]>(queryKeys.clients, 
          previousClients.filter(client => client.id !== clientId)
        );
      }

      return { previousClients };
    },
    onError: (err, variables, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(queryKeys.clients, context.previousClients);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      queryClient.invalidateQueries({ queryKey: queryKeys.clientStats });
    },
    ...options,
  });
}

// ============================================================================
// PROJECT QUERIES & MUTATIONS
// ============================================================================

export function useProjectsQuery(options?: Partial<UseQueryOptions<Project[], Error>>) {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: ProjectService.getAll,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
}

export function useProjectStatsQuery(options?: Partial<UseQueryOptions<ProjectStats, Error>>) {
  return useQuery({
    queryKey: queryKeys.projectStats,
    queryFn: ProjectService.getStats,
    staleTime: 3 * 60 * 1000, // 3 minutes
    ...options,
  });
}

export function useCreateProjectMutation(options?: UseMutationOptions<Project, Error, Omit<Project, 'id' | 'created_at' | 'updated_at'>>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ProjectService.create,
    onMutate: async (newProject) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects });
      await queryClient.cancelQueries({ queryKey: queryKeys.projectStats });

      const previousProjects = queryClient.getQueryData<Project[]>(queryKeys.projects);
      
      if (previousProjects) {
        const optimisticProject: Project = {
          ...newProject,
          id: `temp-${Date.now()}`,
          actual_hours: newProject.actual_hours || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        queryClient.setQueryData<Project[]>(queryKeys.projects, [optimisticProject, ...previousProjects]);
      }

      return { previousProjects };
    },
    onError: (err, variables, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(queryKeys.projects, context.previousProjects);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      queryClient.invalidateQueries({ queryKey: queryKeys.projectStats });
    },
    ...options,
  });
}

export function useUpdateProjectMutation(options?: UseMutationOptions<Project, Error, { id: string; data: Partial<Project> }>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => ProjectService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects });
      
      const previousProjects = queryClient.getQueryData<Project[]>(queryKeys.projects);
      
      if (previousProjects) {
        queryClient.setQueryData<Project[]>(queryKeys.projects, 
          previousProjects.map(project => 
            project.id === id ? { ...project, ...data, updated_at: new Date().toISOString() } : project
          )
        );
      }

      return { previousProjects };
    },
    onError: (err, variables, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(queryKeys.projects, context.previousProjects);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      queryClient.invalidateQueries({ queryKey: queryKeys.projectStats });
    },
    ...options,
  });
}

// ============================================================================
// REVENUE QUERIES & MUTATIONS
// ============================================================================

export function useRevenueQuery(options?: Partial<UseQueryOptions<RevenueEntry[], Error>>) {
  return useQuery({
    queryKey: queryKeys.revenue,
    queryFn: RevenueService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

export function useRevenueStatsQuery(options?: Partial<UseQueryOptions<RevenueStats, Error>>) {
  return useQuery({
    queryKey: queryKeys.revenueStats,
    queryFn: RevenueService.getStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

export function useMonthlyTrendsQuery(year?: number, options?: Partial<UseQueryOptions<MonthlyRevenue[], Error>>) {
  return useQuery({
    queryKey: queryKeys.monthlyTrends(year),
    queryFn: () => RevenueService.getMonthlyTrends(year),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

export function useRevenueByTypeQuery(year?: number, options?: Partial<UseQueryOptions<RevenueByType, Error>>) {
  return useQuery({
    queryKey: queryKeys.revenueByType(year),
    queryFn: () => RevenueService.getRevenueByType(year),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

export function useCreateRevenueMutation(options?: UseMutationOptions<RevenueEntry, Error, Omit<RevenueEntry, 'id' | 'created_at'>>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: RevenueService.create,
    onSuccess: () => {
      // Invalidate all revenue-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.revenue });
      queryClient.invalidateQueries({ queryKey: queryKeys.revenueStats });
      queryClient.invalidateQueries({ queryKey: ['revenue', 'trends'] });
      queryClient.invalidateQueries({ queryKey: ['revenue', 'by-type'] });
    },
    ...options,
  });
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateClients: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      queryClient.invalidateQueries({ queryKey: queryKeys.clientStats });
    },
    invalidateProjects: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      queryClient.invalidateQueries({ queryKey: queryKeys.projectStats });
    },
    invalidateRevenue: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.revenue });
      queryClient.invalidateQueries({ queryKey: queryKeys.revenueStats });
      queryClient.invalidateQueries({ queryKey: ['revenue', 'trends'] });
      queryClient.invalidateQueries({ queryKey: ['revenue', 'by-type'] });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries();
    },
  };
}

export function usePrefetchQueries() {
  const queryClient = useQueryClient();

  return {
    prefetchClients: () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.clients,
        queryFn: ClientService.getAll,
        staleTime: 2 * 60 * 1000,
      });
    },
    prefetchProjects: () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.projects,
        queryFn: ProjectService.getAll,
        staleTime: 2 * 60 * 1000,
      });
    },
    prefetchRevenue: () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.revenue,
        queryFn: RevenueService.getAll,
        staleTime: 5 * 60 * 1000,
      });
    },
  };
}
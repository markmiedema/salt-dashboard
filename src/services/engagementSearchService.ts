import { supabase } from './supabase';
import { Interaction } from './interactionsService';
import { Milestone } from './milestonesService';
import { Document } from './documentsService';

export type EngagementType = 'interaction' | 'milestone' | 'document';

export interface EngagementSearchResult {
  id: string;
  type: EngagementType;
  title: string; // summary/name/title
  event_date: string; // occurred_at, target_date or created_at
  client_id: string;
  project_id: string | null;
  raw: Interaction | Milestone | Document;
}

export interface EngagementSearchFilters {
  clientId?: string;
  projectId?: string;
  keyword?: string;
  from?: string;
  to?: string;
  categories?: EngagementType[]; // subset to search
}

export class EngagementSearchService {
  static async search(filters?: EngagementSearchFilters): Promise<EngagementSearchResult[]> {
    const categories = filters?.categories ?? ['interaction', 'milestone', 'document'];

    const promises: Promise<EngagementSearchResult[]>[] = [];

    if (categories.includes('interaction')) {
      promises.push(this.searchInteractions(filters));
    }

    if (categories.includes('milestone')) {
      promises.push(this.searchMilestones(filters));
    }

    if (categories.includes('document')) {
      promises.push(this.searchDocuments(filters));
    }

    const results = (await Promise.all(promises)).flat();

    // Sort descending by event_date
    results.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

    return results;
  }

  /* --------------------------- Private helpers --------------------------- */

  private static async searchInteractions(
    filters?: EngagementSearchFilters
  ): Promise<EngagementSearchResult[]> {
    let query = supabase.from('interactions').select('*');

    if (filters?.clientId) query = query.eq('client_id', filters.clientId);
    if (filters?.projectId) query = query.eq('project_id', filters.projectId);
    if (filters?.from) query = query.gte('occurred_at', filters.from);
    if (filters?.to) query = query.lte('occurred_at', filters.to);
    if (filters?.keyword) {
      query = query.or(`summary.ilike.%${filters.keyword}%,follow_up.ilike.%${filters.keyword}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Search interactions failed: ${error.message}`);

    return (data as Interaction[]).map((i) => ({
      id: i.id,
      type: 'interaction',
      title: i.summary,
      event_date: i.occurred_at,
      client_id: i.client_id,
      project_id: i.project_id,
      raw: i
    }));
  }

  private static async searchMilestones(
    filters?: EngagementSearchFilters
  ): Promise<EngagementSearchResult[]> {
    let query = supabase.from('milestones').select('*');

    if (filters?.clientId) query = query.eq('client_id', filters.clientId);
    if (filters?.projectId) query = query.eq('project_id', filters.projectId);
    if (filters?.from) query = query.gte('target_date', filters.from);
    if (filters?.to) query = query.lte('target_date', filters.to);
    if (filters?.keyword) {
      query = query.ilike('name', `%${filters.keyword}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Search milestones failed: ${error.message}`);

    return (data as Milestone[]).map((m) => ({
      id: m.id,
      type: 'milestone',
      title: m.name,
      event_date: m.target_date ?? m.updated_at,
      client_id: m.client_id,
      project_id: m.project_id,
      raw: m
    }));
  }

  private static async searchDocuments(
    filters?: EngagementSearchFilters
  ): Promise<EngagementSearchResult[]> {
    let query = supabase.from('documents').select('*');

    if (filters?.clientId) query = query.eq('client_id', filters.clientId);
    if (filters?.projectId) query = query.eq('project_id', filters.projectId);
    if (filters?.milestoneId) query = query.eq('milestone_id', filters.milestoneId);
    if (filters?.from) query = query.gte('created_at', filters.from);
    if (filters?.to) query = query.lte('created_at', filters.to);
    if (filters?.keyword) {
      query = query.ilike('title', `%${filters.keyword}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Search documents failed: ${error.message}`);

    return (data as Document[]).map((d) => ({
      id: d.id,
      type: 'document',
      title: d.title,
      event_date: d.created_at,
      client_id: d.client_id,
      project_id: d.project_id,
      raw: d
    }));
  }
}

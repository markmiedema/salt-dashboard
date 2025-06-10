import { supabase } from './supabase';
import { milestoneCreateSchema, milestoneUpdateSchema } from '../validators/engagementSchemas';
import { TeamsIntegrationService } from './teamsIntegrationService';

export type MilestoneStatus = 'not_started' | 'in_progress' | 'complete';

export interface Milestone {
  id: string;
  client_id: string;
  project_id: string;
  name: string;
  description: string | null;
  target_date: string | null;
  status: MilestoneStatus;
  owner_id: string | null;
  depends_on: string[] | null; // array of prerequisite milestone ids
  created_at: string;
  updated_at: string;
}

export interface MilestoneFilters {
  projectId?: string;
  clientId?: string;
  status?: MilestoneStatus;
  search?: string;
}

export class MilestonesService {
  static async getAll(filters?: MilestoneFilters): Promise<Milestone[]> {
    let query = supabase.from('milestones').select('*').order('target_date', { ascending: true });

    if (filters?.projectId) {
      query = query.eq('project_id', filters.projectId);
    }

    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching milestones:', error);
      throw new Error(`Failed to fetch milestones: ${error.message}`);
    }

    return data as Milestone[];
  }

  static async getById(id: string): Promise<Milestone | null> {
    const { data, error } = await supabase.from('milestones').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch milestone: ${error.message}`);
    }

    return data as Milestone;
  }

  static async create(
    milestone: Omit<Milestone, 'id' | 'created_at' | 'updated_at' | 'status'> & {
      status?: MilestoneStatus;
    }
  ): Promise<Milestone> {
    // Validate input
    milestoneCreateSchema.parse(milestone);

    const { data, error } = await supabase
      .from('milestones')
      .insert([
        {
          ...milestone,
          status: milestone.status ?? 'not_started',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create milestone: ${error.message}`);
    }

    return data as Milestone;
  }

  static async update(id: string, updates: Partial<Milestone>): Promise<Milestone> {
    // Validate updates
    milestoneUpdateSchema.parse(updates);

    const { data, error } = await supabase
      .from('milestones')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update milestone: ${error.message}`);
    }

    return data as Milestone;
  }

  /**
   * Update status with dependency check.
   * Cannot mark a milestone as complete unless all milestones in depends_on are complete.
   */
  static async updateStatus(id: string, newStatus: MilestoneStatus): Promise<Milestone> {
    // Fetch milestone with dependencies
    const milestone = await this.getById(id);
    if (!milestone) {
      throw new Error('Milestone not found');
    }

    if (newStatus === 'complete' && milestone.depends_on && milestone.depends_on.length > 0) {
      // Fetch prerequisite milestones
      const { data: prereqs, error } = await supabase
        .from('milestones')
        .select('id, status')
        .in('id', milestone.depends_on);

      if (error) {
        throw new Error(`Failed to check dependencies: ${error.message}`);
      }

      const incomplete = (prereqs || []).filter((m) => m.status !== 'complete');
      if (incomplete.length > 0) {
        throw new Error('Cannot complete milestone while prerequisites are incomplete');
      }
    }

    const updatedMilestone = await this.update(id, { status: newStatus });

    // Send Teams notification for milestone status changes (fire-and-forget)
    TeamsIntegrationService.notifyMilestoneUpdate(
      milestone.client_id,
      milestone.project_id,
      milestone.name,
      newStatus
    ).catch(console.error);

    return updatedMilestone;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from('milestones').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete milestone: ${error.message}`);
    }
  }
}
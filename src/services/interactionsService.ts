import { supabase } from './supabase';
import { interactionCreateSchema, interactionUpdateSchema } from '../validators/engagementSchemas';
import { TeamsIntegrationService } from './teamsIntegrationService';

/**
 * Interaction record as returned by the database.
 */
export interface Interaction {
  id: string;
  client_id: string;
  project_id: string | null;
  type: 'call' | 'email' | 'meeting' | 'note';
  occurred_at: string; // ISO timestamp
  participants: string[] | null;
  summary: string;
  follow_up: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InteractionFilters {
  clientId?: string;
  projectId?: string;
  type?: Interaction['type'];
  search?: string; // keyword search summary/follow_up
  from?: string; // ISO start date
  to?: string; // ISO end date
}

export class InteractionsService {
  /**
   * Fetch interactions with optional filters.
   */
  static async getAll(filters?: InteractionFilters): Promise<Interaction[]> {
    let query = supabase
      .from('interactions')
      .select('*')
      .order('occurred_at', { ascending: false });

    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId);
    }

    if (filters?.projectId) {
      query = query.eq('project_id', filters.projectId);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.from) {
      query = query.gte('occurred_at', filters.from);
    }

    if (filters?.to) {
      query = query.lte('occurred_at', filters.to);
    }

    if (filters?.search) {
      // ilike pattern search in summary or follow_up
      query = query.or(`summary.ilike.%${filters.search}%,follow_up.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching interactions:', error);
      throw new Error(`Failed to fetch interactions: ${error.message}`);
    }

    return data as Interaction[];
  }

  /**
   * Fetch single interaction by id.
   */
  static async getById(id: string): Promise<Interaction | null> {
    const { data, error } = await supabase.from('interactions').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch interaction: ${error.message}`);
    }

    return data as Interaction;
  }

  /**
   * Create a new interaction.
   */
  static async create(
    interaction: Omit<Interaction, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Interaction> {
    // Validate input
    interactionCreateSchema.parse(interaction);

    const { data, error } = await supabase
      .from('interactions')
      .insert([
        {
          ...interaction,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create interaction: ${error.message}`);
    }

    // Send Teams notification (fire-and-forget)
    TeamsIntegrationService.sendAdaptiveCard({
      title: 'New Client Interaction Logged',
      text: interaction.summary,
      url: undefined
    }).catch(console.error);

    return data as Interaction;
  }

  /**
   * Update an existing interaction.
   */
  static async update(id: string, updates: Partial<Interaction>): Promise<Interaction> {
    // Validate updates
    interactionUpdateSchema.parse(updates);

    const { data, error } = await supabase
      .from('interactions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update interaction: ${error.message}`);
    }

    return data as Interaction;
  }

  /**
   * Delete interaction by id.
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from('interactions').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete interaction: ${error.message}`);
    }
  }
}

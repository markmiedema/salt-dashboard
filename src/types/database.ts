export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          status: 'active' | 'inactive' | 'prospect';
          entity_type: 'individual' | 'business' | 'partnership' | 'trust';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          status?: 'active' | 'inactive' | 'prospect';
          entity_type?: 'individual' | 'business' | 'partnership' | 'trust';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          status?: 'active' | 'inactive' | 'prospect';
          entity_type?: 'individual' | 'business' | 'partnership' | 'trust';
          notes?: string | null;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          type: 'nexus_analysis' | 'vda' | 'tax_prep' | 'bookkeeping' | 'advisory';
          status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
          amount: number | null;
          estimated_hours: number | null;
          actual_hours: number;
          due_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          type: 'nexus_analysis' | 'vda' | 'tax_prep' | 'bookkeeping' | 'advisory';
          status?: 'pending' | 'in_progress' | 'completed' | 'on_hold';
          amount?: number | null;
          estimated_hours?: number | null;
          actual_hours?: number;
          due_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          name?: string;
          type?: 'nexus_analysis' | 'vda' | 'tax_prep' | 'bookkeeping' | 'advisory';
          status?: 'pending' | 'in_progress' | 'completed' | 'on_hold';
          amount?: number | null;
          estimated_hours?: number | null;
          actual_hours?: number;
          due_date?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      revenue_entries: {
        Row: {
          id: string;
          type: 'returns' | 'on_call' | 'project';
          amount: number;
          month: number;
          year: number;
          description: string | null;
          project_id: string | null;
          client_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: 'returns' | 'on_call' | 'project';
          amount: number;
          month: number;
          year: number;
          description?: string | null;
          project_id?: string | null;
          client_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: 'returns' | 'on_call' | 'project';
          amount?: number;
          month?: number;
          year?: number;
          description?: string | null;
          project_id?: string | null;
          client_id?: string | null;
        };
      };
    };
  };
}

export type Client = Database['public']['Tables']['clients']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type RevenueEntry = Database['public']['Tables']['revenue_entries']['Row'];

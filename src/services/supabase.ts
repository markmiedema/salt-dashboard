import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// In development we allow falling back to mock data; in production we fail fast.
if (!supabaseUrl || !supabaseAnonKey) {
  if (import.meta.env.DEV) {
    console.warn('Supabase environment variables are missing. Falling back to mock data service.');
  } else {
    throw new Error('Supabase environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required in production.');
  }
}

export const supabase = createClient<Database>(
  supabaseUrl ?? 'http://localhost',
  supabaseAnonKey ?? 'public-anon-key'
);

// Mock data service for development without Supabase
export class MockDataService {
  static mockClients = [
    {
      id: '1',
      name: 'Johnson & Associates LLC',
      email: 'contact@johnsonassoc.com',
      phone: '(555) 123-4567',
      status: 'active' as const,
      entity_type: 'business' as const,
      notes: 'Multi-state corporation requiring nexus analysis',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'Sarah Mitchell',
      email: 'sarah.mitchell@email.com',
      phone: '(555) 987-6543',
      status: 'active' as const,
      entity_type: 'individual' as const,
      notes: 'High-net-worth individual, complex returns',
      created_at: '2024-01-20T14:30:00Z',
      updated_at: '2024-01-20T14:30:00Z'
    },
    {
      id: '3',
      name: 'TechStart Inc.',
      email: 'finance@techstart.com',
      phone: '(555) 456-7890',
      status: 'prospect' as const,
      entity_type: 'business' as const,
      notes: 'Startup seeking bookkeeping and advisory services',
      created_at: '2024-02-01T09:15:00Z',
      updated_at: '2024-02-01T09:15:00Z'
    }
  ];

  static mockProjects = [
    {
      id: '1',
      client_id: '1',
      name: 'Q4 2024 Multi-State Tax Analysis',
      type: 'nexus_analysis' as const,
      status: 'in_progress' as const,
      amount: 15000,
      estimated_hours: 40,
      actual_hours: 25,
      due_date: '2024-03-15',
      notes: 'Complex nexus analysis across 8 states',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-02-01T16:30:00Z'
    },
    {
      id: '2',
      client_id: '2',
      name: '2024 Individual Tax Return',
      type: 'tax_prep' as const,
      status: 'pending' as const,
      amount: 2500,
      estimated_hours: 8,
      actual_hours: 0,
      due_date: '2024-04-15',
      notes: 'Schedule K-1 partnerships and rental properties',
      created_at: '2024-02-01T11:00:00Z',
      updated_at: '2024-02-01T11:00:00Z'
    },
    {
      id: '3',
      client_id: '3',
      name: 'Monthly Bookkeeping Setup',
      type: 'bookkeeping' as const,
      status: 'pending' as const,
      amount: 1200,
      estimated_hours: 15,
      actual_hours: 0,
      due_date: '2024-02-28',
      notes: 'Initial setup for QuickBooks integration',
      created_at: '2024-02-01T09:15:00Z',
      updated_at: '2024-02-01T09:15:00Z'
    }
  ];

  static mockRevenue = [
    { id: '1', type: 'returns' as const, amount: 45000, month: 1, year: 2024, description: 'Individual and business returns', project_id: null, client_id: null, created_at: '2024-01-31T23:59:00Z' },
    { id: '2', type: 'project' as const, amount: 18000, month: 1, year: 2024, description: 'Nexus analysis projects', project_id: '1', client_id: '1', created_at: '2024-01-31T23:59:00Z' },
    { id: '3', type: 'on_call' as const, amount: 8500, month: 1, year: 2024, description: 'Advisory consultations', project_id: null, client_id: null, created_at: '2024-01-31T23:59:00Z' },
    { id: '4', type: 'returns' as const, amount: 52000, month: 2, year: 2024, description: 'Tax preparation services', project_id: null, client_id: null, created_at: '2024-02-29T23:59:00Z' },
    { id: '5', type: 'project' as const, amount: 12000, month: 2, year: 2024, description: 'VDA and compliance projects', project_id: null, client_id: null, created_at: '2024-02-29T23:59:00Z' }
  ];
}
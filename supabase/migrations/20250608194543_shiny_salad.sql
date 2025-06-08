/*
  # Tax Agency Dashboard Database Schema

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `email` (text, unique)
      - `phone` (text)
      - `status` (enum: active, inactive, prospect)
      - `entity_type` (enum: individual, business, partnership, trust)
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `projects`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `name` (text, required)
      - `type` (enum: nexus_analysis, vda, tax_prep, bookkeeping, advisory)
      - `status` (enum: pending, in_progress, completed, on_hold)
      - `amount` (numeric)
      - `estimated_hours` (numeric)
      - `actual_hours` (numeric, default 0)
      - `due_date` (date)
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `revenue_entries`
      - `id` (uuid, primary key)
      - `type` (enum: returns, on_call, project)
      - `amount` (numeric, required)
      - `month` (integer, 1-12)
      - `year` (integer)
      - `description` (text)
      - `project_id` (uuid, foreign key to projects, optional)
      - `client_id` (uuid, foreign key to clients, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
    - Add indexes for performance optimization

  3. Data Integrity
    - Foreign key constraints
    - Check constraints for valid enum values
    - Default values for required fields
*/

-- Create custom types for enums
DO $$ BEGIN
  CREATE TYPE client_status AS ENUM ('active', 'inactive', 'prospect');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE entity_type AS ENUM ('individual', 'business', 'partnership', 'trust');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE project_type AS ENUM ('nexus_analysis', 'vda', 'tax_prep', 'bookkeeping', 'advisory');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('pending', 'in_progress', 'completed', 'on_hold');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE revenue_type AS ENUM ('returns', 'on_call', 'project');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  phone text,
  status client_status DEFAULT 'prospect',
  entity_type entity_type DEFAULT 'individual',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  type project_type NOT NULL,
  status project_status DEFAULT 'pending',
  amount numeric(10,2) CHECK (amount >= 0),
  estimated_hours numeric(6,2) CHECK (estimated_hours >= 0),
  actual_hours numeric(6,2) DEFAULT 0 CHECK (actual_hours >= 0),
  due_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create revenue_entries table
CREATE TABLE IF NOT EXISTS public.revenue_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type revenue_type NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL CHECK (year >= 2020 AND year <= 2030),
  description text,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_entity_type ON public.clients(entity_type);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at);

CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_type ON public.projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_due_date ON public.projects(due_date);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at);

CREATE INDEX IF NOT EXISTS idx_revenue_entries_type ON public.revenue_entries(type);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_month_year ON public.revenue_entries(month, year);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_project_id ON public.revenue_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_client_id ON public.revenue_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_created_at ON public.revenue_entries(created_at);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clients table
CREATE POLICY "Users can view all clients"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert clients"
  ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update clients"
  ON public.clients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete clients"
  ON public.clients
  FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for projects table
CREATE POLICY "Users can view all projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert projects"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update projects"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete projects"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for revenue_entries table
CREATE POLICY "Users can view all revenue entries"
  ON public.revenue_entries
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert revenue entries"
  ON public.revenue_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update revenue entries"
  ON public.revenue_entries
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete revenue entries"
  ON public.revenue_entries
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development
INSERT INTO public.clients (id, name, email, phone, status, entity_type, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Johnson & Associates LLC', 'contact@johnsonassoc.com', '(555) 123-4567', 'active', 'business', 'Multi-state corporation requiring nexus analysis'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Sarah Mitchell', 'sarah.mitchell@email.com', '(555) 987-6543', 'active', 'individual', 'High-net-worth individual, complex returns'),
  ('550e8400-e29b-41d4-a716-446655440003', 'TechStart Inc.', 'finance@techstart.com', '(555) 456-7890', 'prospect', 'business', 'Startup seeking bookkeeping and advisory services'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Robert Chen', 'robert.chen@email.com', '(555) 321-9876', 'active', 'individual', 'Real estate investor with multiple properties'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Global Manufacturing Corp', 'tax@globalmanuf.com', '(555) 654-3210', 'active', 'business', 'Large corporation with international operations')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, name, type, status, amount, estimated_hours, actual_hours, due_date, notes) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Q4 2024 Multi-State Tax Analysis', 'nexus_analysis', 'in_progress', 15000.00, 40, 25, '2024-03-15', 'Complex nexus analysis across 8 states'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '2024 Individual Tax Return', 'tax_prep', 'pending', 2500.00, 8, 0, '2024-04-15', 'Schedule K-1 partnerships and rental properties'),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Monthly Bookkeeping Setup', 'bookkeeping', 'pending', 1200.00, 15, 0, '2024-02-28', 'Initial setup for QuickBooks integration'),
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'Real Estate Portfolio Review', 'advisory', 'in_progress', 3500.00, 12, 8, '2024-03-01', 'Tax optimization for rental properties'),
  ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'International Tax Compliance', 'tax_prep', 'completed', 25000.00, 60, 58, '2024-01-31', 'Form 5471 and transfer pricing documentation')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.revenue_entries (type, amount, month, year, description, project_id, client_id) VALUES
  ('returns', 45000.00, 1, 2024, 'Individual and business tax returns', null, null),
  ('project', 18000.00, 1, 2024, 'Nexus analysis projects', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001'),
  ('on_call', 8500.00, 1, 2024, 'Advisory consultations', null, null),
  ('returns', 52000.00, 2, 2024, 'Tax preparation services', null, null),
  ('project', 12000.00, 2, 2024, 'VDA and compliance projects', null, null),
  ('returns', 38000.00, 3, 2024, 'Q1 tax return filings', null, null),
  ('on_call', 15000.00, 3, 2024, 'Strategic tax planning sessions', null, null),
  ('project', 25000.00, 1, 2024, 'International compliance project', '660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005')
ON CONFLICT DO NOTHING;
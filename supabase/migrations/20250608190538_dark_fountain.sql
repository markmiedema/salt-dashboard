/*
  # Tax Agency Dashboard Database Schema

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `email` (text, optional)
      - `phone` (text, optional)
      - `status` (enum: active, prospect, inactive)
      - `entity_type` (enum: individual, business, partnership, trust)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `projects`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `name` (text, required)
      - `type` (enum: nexus_analysis, vda, tax_prep, bookkeeping, advisory)
      - `status` (enum: pending, in_progress, completed, on_hold)
      - `amount` (numeric, optional)
      - `estimated_hours` (integer, optional)
      - `actual_hours` (integer, default 0)
      - `due_date` (date, optional)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `revenue_entries`
      - `id` (uuid, primary key)
      - `type` (enum: returns, project, on_call)
      - `amount` (numeric, required)
      - `month` (integer, required)
      - `year` (integer, required)
      - `description` (text, optional)
      - `project_id` (uuid, optional foreign key to projects)
      - `client_id` (uuid, optional foreign key to clients)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
*/

-- Create custom types
CREATE TYPE client_status AS ENUM ('active', 'prospect', 'inactive');
CREATE TYPE entity_type AS ENUM ('individual', 'business', 'partnership', 'trust');
CREATE TYPE project_type AS ENUM ('nexus_analysis', 'vda', 'tax_prep', 'bookkeeping', 'advisory');
CREATE TYPE project_status AS ENUM ('pending', 'in_progress', 'completed', 'on_hold');
CREATE TYPE revenue_type AS ENUM ('returns', 'project', 'on_call');

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  status client_status NOT NULL DEFAULT 'prospect',
  entity_type entity_type NOT NULL DEFAULT 'individual',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  type project_type NOT NULL,
  status project_status NOT NULL DEFAULT 'pending',
  amount numeric,
  estimated_hours integer,
  actual_hours integer DEFAULT 0,
  due_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create revenue_entries table
CREATE TABLE IF NOT EXISTS revenue_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type revenue_type NOT NULL,
  amount numeric NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL,
  description text,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for clients table
CREATE POLICY "Enable read access for all users" ON clients FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON clients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON clients FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON clients FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for projects table
CREATE POLICY "Enable read access for all users" ON projects FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON projects FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON projects FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for revenue_entries table
CREATE POLICY "Enable read access for all users" ON revenue_entries FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON revenue_entries FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON revenue_entries FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON revenue_entries FOR DELETE USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_entity_type ON clients(entity_type);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_due_date ON projects(due_date);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_month_year ON revenue_entries(month, year);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_type ON revenue_entries(type);

-- Insert sample data
INSERT INTO clients (name, email, phone, status, entity_type, notes) VALUES
('Johnson & Associates LLC', 'contact@johnsonassoc.com', '(555) 123-4567', 'active', 'business', 'Multi-state corporation requiring nexus analysis'),
('Sarah Mitchell', 'sarah.mitchell@email.com', '(555) 987-6543', 'active', 'individual', 'High-net-worth individual, complex returns'),
('TechStart Inc.', 'finance@techstart.com', '(555) 456-7890', 'prospect', 'business', 'Startup seeking bookkeeping and advisory services'),
('Robert Chen', 'robert.chen@email.com', '(555) 234-5678', 'active', 'individual', 'Schedule K-1 partnerships and rental properties'),
('Global Manufacturing Corp', 'tax@globalmanuf.com', '(555) 345-6789', 'active', 'business', 'Large corporation with multi-state operations');

-- Insert sample projects (using client IDs from the inserted clients)
INSERT INTO projects (client_id, name, type, status, amount, estimated_hours, actual_hours, due_date, notes)
SELECT 
  c.id,
  'Q4 2024 Multi-State Tax Analysis',
  'nexus_analysis',
  'in_progress',
  15000,
  40,
  25,
  '2024-03-15',
  'Complex nexus analysis across 8 states'
FROM clients c WHERE c.name = 'Johnson & Associates LLC';

INSERT INTO projects (client_id, name, type, status, amount, estimated_hours, actual_hours, due_date, notes)
SELECT 
  c.id,
  '2024 Individual Tax Return',
  'tax_prep',
  'pending',
  2500,
  8,
  0,
  '2024-04-15',
  'Schedule K-1 partnerships and rental properties'
FROM clients c WHERE c.name = 'Sarah Mitchell';

INSERT INTO projects (client_id, name, type, status, amount, estimated_hours, actual_hours, due_date, notes)
SELECT 
  c.id,
  'Monthly Bookkeeping Setup',
  'bookkeeping',
  'pending',
  1200,
  15,
  0,
  '2024-02-28',
  'Initial setup for QuickBooks integration'
FROM clients c WHERE c.name = 'TechStart Inc.';

-- Insert sample revenue entries
INSERT INTO revenue_entries (type, amount, month, year, description) VALUES
('returns', 45000, 1, 2024, 'Individual and business returns'),
('project', 18000, 1, 2024, 'Nexus analysis projects'),
('on_call', 8500, 1, 2024, 'Advisory consultations'),
('returns', 52000, 2, 2024, 'Tax preparation services'),
('project', 12000, 2, 2024, 'VDA and compliance projects'),
('returns', 38000, 3, 2024, 'Q1 tax preparation'),
('on_call', 15000, 3, 2024, 'Strategic tax planning consultations');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
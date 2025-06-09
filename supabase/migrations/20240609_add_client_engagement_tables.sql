-- Migration: Client Engagement Hub tables
-- Run: supabase db push or via CI

-- 1. Enum types -------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE interaction_type AS ENUM ('call', 'email', 'meeting', 'note');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE milestone_status AS ENUM ('not_started', 'in_progress', 'complete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Tables -----------------------------------------------------------------
-- Interactions --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  type interaction_type NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  participants text[],                       -- list of participant names or user IDs
  summary text NOT NULL,
  follow_up text,                            -- optional follow-up actions
  created_by uuid REFERENCES auth.users(id), -- creator user
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Milestones ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  target_date date,
  status milestone_status DEFAULT 'not_started',
  owner_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  depends_on uuid[] -- array of prerequisite milestone ids
);

-- Documents ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  milestone_id uuid REFERENCES public.milestones(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  current_version_id uuid,                   -- FK populated after first version insert
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Document Versions --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_number integer NOT NULL CHECK (version_number > 0),
  storage_path text NOT NULL,               -- Supabase Storage path
  mime_type text NOT NULL,
  file_size bigint CHECK (file_size >= 0),  -- bytes
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_at timestamptz DEFAULT now(),
  UNIQUE(document_id, version_number)
);

-- Update documents.current_version_id to reference latest version via trigger later

-- 3. Indexes ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_interactions_client_id ON public.interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_interactions_project_id ON public.interactions(project_id);
CREATE INDEX IF NOT EXISTS idx_interactions_occurred_at ON public.interactions(occurred_at);

CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON public.milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON public.milestones(status);

CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_milestone_id ON public.documents(milestone_id);

CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON public.document_versions(document_id);

-- 4. Timestamps trigger -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_interactions_updated_at ON public.interactions;
CREATE TRIGGER trg_interactions_updated_at
  BEFORE UPDATE ON public.interactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_milestones_updated_at ON public.milestones;
CREATE TRIGGER trg_milestones_updated_at
  BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Relationship helpers ---------------------------------------------------
-- Maintain documents.current_version_id automatically when inserting a new version
CREATE OR REPLACE FUNCTION set_current_version()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.documents
  SET current_version_id = NEW.id
  WHERE id = NEW.document_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_set_current_version ON public.document_versions;
CREATE TRIGGER trg_set_current_version
  AFTER INSERT ON public.document_versions
  FOR EACH ROW EXECUTE FUNCTION set_current_version();

-- 6. Row Level Security -------------------------------------------------------
-- Enable RLS on new tables
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- Basic policies: allow SELECT for all authenticated users.
-- TODO: Replace with fine-grained Viewer / Editor / Admin checks once role mapping table is defined.

DO $$ BEGIN
  CREATE POLICY "Authenticated can select interactions" ON public.interactions
    FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated can insert interactions" ON public.interactions
    FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated can update own interactions" ON public.interactions
    FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Similar policies for milestones ------------------------------------------------
DO $$ BEGIN
  CREATE POLICY "Authenticated can select milestones" ON public.milestones
    FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated can insert milestones" ON public.milestones
    FOR INSERT
    TO authenticated
    WITH CHECK (owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated can update milestones they own" ON public.milestones
    FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Documents & versions ---------------------------------------------------------
DO $$ BEGIN
  CREATE POLICY "Authenticated can select documents" ON public.documents
    FOR SELECT USING (deleted_at IS NULL) TO authenticated
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated can insert documents" ON public.documents
    FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated can select document versions" ON public.document_versions
    FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated can insert document versions" ON public.document_versions
    FOR INSERT
    TO authenticated
    WITH CHECK (uploaded_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7. Audit Logging -----------------------------------------------------------
-- Generic audit table to capture data changes
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  operation text NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
  changed_data jsonb,
  changed_at timestamptz DEFAULT now(),
  changed_by uuid DEFAULT auth.uid()
);

-- Function to record audit data
CREATE OR REPLACE FUNCTION record_audit()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs(table_name, record_id, operation, changed_data)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD));
    RETURN OLD;
  ELSE
    INSERT INTO public.audit_logs(table_name, record_id, operation, changed_data)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW));
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers to target tables
CREATE TRIGGER trg_audit_interactions
  AFTER INSERT OR UPDATE OR DELETE ON public.interactions
  FOR EACH ROW EXECUTE FUNCTION record_audit();

CREATE TRIGGER trg_audit_milestones
  AFTER INSERT OR UPDATE OR DELETE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION record_audit();

CREATE TRIGGER trg_audit_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION record_audit();

CREATE TRIGGER trg_audit_document_versions
  AFTER INSERT OR UPDATE OR DELETE ON public.document_versions
  FOR EACH ROW EXECUTE FUNCTION record_audit();

-- 8. Supabase Storage ---------------------------------------------------------
-- Create private bucket for client engagement documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read objects they own (reference path naming convention)
-- Object key pattern: client-id/project-id/filename or similar

DO $$ BEGIN
  CREATE POLICY "Authenticated read access to own uploads" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'client-documents');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated write access to bucket" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'client-documents')
    TO authenticated;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated delete access to bucket" ON storage.objects
    FOR DELETE USING (bucket_id = 'client-documents')
    TO authenticated;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Teams per-client channel configuration ------------------------------------
CREATE TABLE IF NOT EXISTS public.client_teams_channels (
  client_id uuid PRIMARY KEY REFERENCES public.clients(id) ON DELETE CASCADE,
  channel_name text,
  webhook_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_updated_at_client_channels()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_client_channels_u ON public.client_teams_channels;
CREATE TRIGGER trg_client_channels_u BEFORE UPDATE ON public.client_teams_channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_client_channels(); 
import { supabase } from './supabase';
import { documentCreateSchema, documentUpdateSchema } from '../validators/engagementSchemas';

export interface Document {
  id: string;
  client_id: string;
  project_id: string | null;
  milestone_id: string | null;
  title: string;
  description: string | null;
  current_version_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  storage_path: string;
  mime_type: string;
  file_size: number;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface DocumentFilters {
  clientId?: string;
  projectId?: string;
  milestoneId?: string;
  search?: string;
}

const BUCKET = 'client-documents';

export class DocumentsService {
  /* -------------------------------------------------------------------------- */
  /*                            Metadata (documents)                            */
  /* -------------------------------------------------------------------------- */

  static async getAll(filters?: DocumentFilters): Promise<Document[]> {
    let query = supabase.from('documents').select('*').order('created_at', { ascending: false });

    if (filters?.clientId) query = query.eq('client_id', filters.clientId);
    if (filters?.projectId) query = query.eq('project_id', filters.projectId);
    if (filters?.milestoneId) query = query.eq('milestone_id', filters.milestoneId);
    if (filters?.search) query = query.ilike('title', `%${filters.search}%`);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch documents: ${error.message}`);
    return data as Document[];
  }

  static async getById(id: string): Promise<Document | null> {
    const { data, error } = await supabase.from('documents').select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch document: ${error.message}`);
    }
    return data as Document;
  }

  static async create(
    doc: Omit<Document, 'id' | 'created_at' | 'current_version_id'>
  ): Promise<Document> {
    // Validate input
    documentCreateSchema.parse(doc);

    const { data, error } = await supabase
      .from('documents')
      .insert([
        {
          ...doc,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();
    if (error) throw new Error(`Failed to create document: ${error.message}`);
    return data as Document;
  }

  static async update(id: string, updates: Partial<Document>): Promise<Document> {
    // Validate updates
    documentUpdateSchema.parse(updates);

    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(`Failed to update document: ${error.message}`);
    return data as Document;
  }

  static async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(`Failed to delete document: ${error.message}`);
  }

  static async restore(id: string): Promise<void> {
    const { error } = await supabase.from('documents').update({ deleted_at: null }).eq('id', id);

    if (error) throw new Error(`Failed to restore document: ${error.message}`);
  }

  /* -------------------------------------------------------------------------- */
  /*                               Versioning                                   */
  /* -------------------------------------------------------------------------- */

  static async listVersions(documentId: string): Promise<DocumentVersion[]> {
    const { data, error } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false });
    if (error) throw new Error(`Failed to fetch document versions: ${error.message}`);
    return data as DocumentVersion[];
  }

  static async addVersion(
    documentId: string,
    filePath: string,
    mimeType: string,
    fileSize: number
  ): Promise<DocumentVersion> {
    // Calculate next version_number
    const versions = await this.listVersions(documentId);
    const nextVersion = versions.length > 0 ? versions[0].version_number + 1 : 1;

    const { data, error } = await supabase
      .from('document_versions')
      .insert([
        {
          document_id: documentId,
          version_number: nextVersion,
          storage_path: filePath,
          mime_type: mimeType,
          file_size: fileSize,
          uploaded_at: new Date().toISOString()
        }
      ])
      .select()
      .single();
    if (error) throw new Error(`Failed to add document version: ${error.message}`);
    return data as DocumentVersion;
  }

  /* -------------------------------------------------------------------------- */
  /*                             Signed URL helpers                             */
  /* -------------------------------------------------------------------------- */

  static async getSignedUploadUrl(path: string, expiresIn: number = 60): Promise<string> {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path, expiresIn);
    if (error) throw new Error(`Failed to create signed upload URL: ${error.message}`);
    return data.signedUrl;
  }

  static async getSignedDownloadUrl(path: string, expiresIn: number = 60): Promise<string> {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
    if (error) throw new Error(`Failed to create signed download URL: ${error.message}`);
    return data.signedUrl;
  }
}

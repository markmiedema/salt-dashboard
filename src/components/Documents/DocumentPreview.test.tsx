import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocumentPreview } from './DocumentPreview';
import * as docSvc from '../../services/documentsService';

vi.mock('../../services/documentsService');

const mockVersions = [
  {
    id: 'v1',
    document_id: 'd1',
    version_number: 1,
    storage_path: 'path/v1',
    mime_type: 'application/pdf',
    file_size: 1000,
    uploaded_by: null,
    uploaded_at: new Date().toISOString()
  }
];

describe('DocumentPreview', () => {
  it('renders version list', async () => {
    (docSvc.DocumentsService.listVersions as any).mockResolvedValue(mockVersions);
    (docSvc.DocumentsService.getSignedDownloadUrl as any).mockResolvedValue('http://example.com');

    render(<DocumentPreview documentId="d1" onClose={() => {}} />);

    expect(await screen.findByText('v1')).toBeInTheDocument();
  });
});

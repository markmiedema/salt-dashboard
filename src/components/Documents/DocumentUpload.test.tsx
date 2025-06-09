import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentUpload } from './DocumentUpload';
import * as docSvc from '../../services/documentsService';

// Mock documents service
vi.mock('../../services/documentsService');

describe('DocumentUpload', () => {
  it('shows error if file exceeds 200MB', async () => {
    window.alert = vi.fn();

    render(<DocumentUpload clientId="c1" />);

    const input = screen
      .getByText(/drag/i)
      .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

    const bigFile = new File([new ArrayBuffer(201 * 1024 * 1024)], 'big.pdf', {
      type: 'application/pdf'
    });
    await userEvent.upload(input, bigFile);

    expect(window.alert).toHaveBeenCalled();
  });
});

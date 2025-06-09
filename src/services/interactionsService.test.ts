import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InteractionsService } from './interactionsService';
import { supabase } from './supabase';

// Helper to mock Supabase query builder chain
function mockInsertSuccess(returnData: any) {
  const single = vi.fn().mockResolvedValue({ data: returnData, error: null });
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });
  vi.spyOn(supabase, 'from').mockReturnValue({ insert } as any);
}

describe('InteractionsService.create', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws validation error when summary is empty', async () => {
    mockInsertSuccess({});
    await expect(
      InteractionsService.create({
        client_id: '11111111-1111-1111-1111-111111111111',
        project_id: null,
        type: 'note',
        occurred_at: new Date().toISOString(),
        participants: null,
        summary: '', // invalid
        follow_up: null,
        created_by: null
      } as any)
    ).rejects.toThrow();
  });

  it('creates interaction when data is valid', async () => {
    const mockData = {
      id: 'i1',
      client_id: '11111111-1111-1111-1111-111111111111',
      project_id: null,
      type: 'note',
      occurred_at: new Date().toISOString(),
      participants: null,
      summary: 'Worked on documents',
      follow_up: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockInsertSuccess(mockData);

    const result = await InteractionsService.create({
      ...mockData,
      id: undefined,
      created_at: undefined,
      updated_at: undefined
    } as any);
    expect(result).toEqual(mockData);
  });
});

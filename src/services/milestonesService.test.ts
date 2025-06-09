import { describe, it, expect, vi } from 'vitest';
import { MilestonesService, MilestoneStatus } from './milestonesService';
import { supabase } from './supabase';

function mockMilestoneData(
  status: MilestoneStatus = 'not_started',
  dependsOn: string[] | null = null
) {
  return {
    id: 'm1',
    client_id: 'c1',
    project_id: 'p1',
    name: 'Milestone 1',
    description: null,
    target_date: null,
    status,
    owner_id: null,
    depends_on: dependsOn,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } as any;
}

describe('MilestonesService.updateStatus', () => {
  afterEach(() => vi.restoreAllMocks());

  it('throws when dependencies are incomplete', async () => {
    const milestone = mockMilestoneData('in_progress', ['pre1']);

    const mockSelectSingle = vi.fn().mockResolvedValue({ data: milestone, error: null });
    const mockEqSingle = vi.fn().mockReturnValue({ single: mockSelectSingle });

    // First call: getById -> supabase.from('milestones').select('*').eq('id', id).single()
    const selectFn1 = vi.fn().mockReturnValue({ eq: mockEqSingle });

    // Second call: dependency check -> supabase.from('milestones').select('id, status').in('id', depends_on)
    const mockIn = vi
      .fn()
      .mockResolvedValue({ data: [mockMilestoneData('in_progress')], error: null });
    const selectFn2 = vi.fn().mockReturnValue({ in: mockIn });

    const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'milestones') {
        // Return different chains based on select signature length
        // We'll check if select called with '*' vs 'id, status'
        return {
          select: (cols: string) => {
            if (cols.includes('id, status')) {
              return { in: mockIn } as any;
            }
            return { eq: mockEqSingle } as any;
          }
        } as any;
      }
      return {} as any;
    });

    await expect(MilestonesService.updateStatus('m1', 'complete')).rejects.toThrow();
    expect(fromSpy).toHaveBeenCalled();
  });
});

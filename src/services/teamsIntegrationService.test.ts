import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeamsIntegrationService } from './teamsIntegrationService';

// Mock fetch
vi.stubGlobal('fetch', vi.fn());

beforeEach(() => {
  (global.fetch as any).mockReset();
});

describe('TeamsIntegrationService.sendAdaptiveCard', () => {
  it('skips when webhook URL not configured', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await TeamsIntegrationService.sendAdaptiveCard({ title: 't', text: 'msg' });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('POSTs to Teams webhook', async () => {
    (global as any).import_meta = { env: { VITE_TEAMS_WEBHOOK_URL: 'https://example.com' } };
    (global.fetch as any).mockResolvedValue({ ok: true });
    await TeamsIntegrationService.sendAdaptiveCard({ title: 'Hello', text: 'World' });
    expect(global.fetch).toHaveBeenCalledWith('https://example.com', expect.any(Object));
  });
});

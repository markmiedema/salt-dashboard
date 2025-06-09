import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TimelineFeed } from './TimelineFeed';
import * as searchService from '../../services/engagementSearchService';

const mockResults = [
  {
    id: '1',
    type: 'interaction',
    title: 'Client call',
    event_date: new Date().toISOString(),
    client_id: 'c1',
    project_id: null,
    raw: {} as any
  }
];

describe('TimelineFeed', () => {
  it('renders and triggers search on keyword input', async () => {
    vi.spyOn(searchService.EngagementSearchService, 'search').mockResolvedValue(mockResults as any);

    render(<TimelineFeed clientId="c1" />);

    const input = screen.getByPlaceholderText(/search keywords/i);
    fireEvent.change(input, { target: { value: 'call' } });

    expect(await screen.findByText('Client call')).toBeInTheDocument();
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MatchesList } from '@/components/MatchesList';
import { jsonResponse, makeMatch } from '@/test/factories';

describe('MatchesList', () => {
  it('renders matches, toggles shortlist, saves a note, and filters by gender', async () => {
    const user = userEvent.setup();
    const matches = [
      makeMatch(1, { name: makeMatch(1).name }),
      makeMatch(2, { name: { ...makeMatch(2).name, gender: 'boy' } }),
    ];
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/matches?') {
        return Promise.resolve(jsonResponse({ matches, count: matches.length }));
      }
      if (url === '/api/matches?gender=boy') {
        return Promise.resolve(jsonResponse({ matches: [matches[1]], count: 1 }));
      }
      if (url === '/api/matches/match-1' && init?.method === 'PATCH') {
        return Promise.resolve(jsonResponse({ match: matches[0] }));
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<MatchesList onGoToDeck={vi.fn()} />);
    expect(await screen.findByText('Name 1 Mata')).toBeInTheDocument();
    expect(screen.getByText('Name 2 Mata')).toBeInTheDocument();
    expect(screen.getByText('Name 1 Mata')).toHaveClass('break-words');
    expect(document.getElementById('screen-our-list')).toHaveClass('min-h-0', 'overflow-hidden');
    expect(screen.getByTestId('matches-scroll-region')).toHaveClass('flex-1', 'min-h-0', 'overflow-y-auto');

    await user.click(screen.getAllByRole('button', { name: 'Add to shortlist' })[0]);
    expect(screen.getByRole('button', { name: 'Remove from shortlist' })).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/matches/match-1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ shortlisted: true }),
      }),
    ));

    await user.click(screen.getByText('Name 1 Mata'));
    const note = screen.getByLabelText('Shared Note');
    await user.type(note, 'Works with the family name');
    await user.tab();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/matches/match-1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ note: 'Works with the family name' }),
      }),
    ));

    await user.click(screen.getByRole('button', { name: 'Close detail' }));
    await user.click(screen.getByRole('button', { name: 'Boys' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/matches?gender=boy'));
    expect(await screen.findByText('Name 2 Mata')).toBeInTheDocument();
  });

  it('shows the empty state when no matches exist', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ matches: [], count: 0 })));

    render(<MatchesList onGoToDeck={vi.fn()} />);

    expect(await screen.findByText('No shared matches yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Swiping' })).toBeInTheDocument();
  });
});

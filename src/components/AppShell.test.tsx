import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AppShell } from '@/components/AppShell';
import { jsonResponse, makeCouple, makeProfile } from '@/test/factories';

vi.mock('@/components/DeckScreen', () => ({ DeckScreen: () => <div>Deck</div> }));
vi.mock('@/components/MatchToast', () => ({ MatchToast: () => null }));

describe('AppShell gates', () => {
  it('routes a 401 response to the sign-in screen', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'Unauthorized' }, 401)));

    render(<AppShell />);

    expect(await screen.findByRole('button', { name: 'Send Magic Link' })).toBeInTheDocument();
    expect(screen.queryByText('Could not load the app')).not.toBeInTheDocument();
  });

  it('routes an authenticated profile with no couple to onboarding', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      profile: makeProfile(),
      couple: null,
      partner: null,
      stats: null,
    })));

    render(<AppShell />);

    expect(await screen.findByRole('heading', { name: 'Welcome to Baby Names' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create & Get Code' })).toBeInTheDocument();
  });

  it('refreshes swipe statistics when opening settings', async () => {
    const user = userEvent.setup();
    const me = (my_swipes: number) => jsonResponse({
      profile: makeProfile({ couple_id: 'couple-1' }),
      couple: makeCouple(),
      partner: null,
      stats: { total_names: 408, my_swipes, partner_swipes: 3, my_likes: 4, matches: 2, shortlisted: 1 },
    });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(me(1))
      .mockResolvedValueOnce(me(9));
    vi.stubGlobal('fetch', fetchMock);

    render(<AppShell />);
    await screen.findByText('Deck');
    await user.click(screen.getByRole('button', { name: 'Settings and profile' }));

    expect(await screen.findByText('9')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/me');
  });
});

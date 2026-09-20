import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppShell } from '@/components/AppShell';
import { jsonResponse, makeProfile } from '@/test/factories';

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
});

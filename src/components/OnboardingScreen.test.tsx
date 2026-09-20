import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { OnboardingScreen } from '@/components/OnboardingScreen';
import { jsonResponse, makeCouple } from '@/test/factories';

function renderOnboarding(
  onCreateCouple = vi.fn().mockResolvedValue({ success: true }),
  onJoinCouple = vi.fn().mockResolvedValue({ success: true }),
) {
  const onCoupleReady = vi.fn();
  render(
    <OnboardingScreen
      onCoupleReady={onCoupleReady}
      onCreateCouple={onCreateCouple}
      onJoinCouple={onJoinCouple}
    />,
  );
  return { onCoupleReady };
}

describe('OnboardingScreen', () => {
  it('creates a couple and shows its invite code', async () => {
    const user = userEvent.setup();
    const couple = makeCouple();
    const onCreateCouple = vi.fn().mockResolvedValue({ success: true });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ couple })));
    renderOnboarding(onCreateCouple);

    await user.type(screen.getByPlaceholderText('e.g. Baby Mata'), 'Our shortlist');
    await user.click(screen.getByRole('button', { name: 'Create & Get Code' }));

    expect(onCreateCouple).toHaveBeenCalledWith('Our shortlist');
    expect(await screen.findByText('Q95N8X')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Swiping Now' })).toBeInTheDocument();
  });

  it('shows an error when the new couple cannot be reloaded', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'Profile unavailable' }, 500)));
    renderOnboarding();

    await user.click(screen.getByRole('button', { name: 'Create & Get Code' }));

    expect(await screen.findByText('Could not load your invite code. Please try again.')).toBeInTheDocument();
  });

  it.each([
    {
      code: 'invalid_invite_code',
      message: 'We could not find a list with that invite code. Please double check with your partner.',
    },
    {
      code: 'couple_full',
      message: 'This couple list already has two partners connected.',
    },
  ])('shows the $code join failure', async ({ code, message }) => {
    const user = userEvent.setup();
    const onJoinCouple = vi.fn().mockResolvedValue({ success: false, code });
    renderOnboarding(undefined, onJoinCouple);

    await user.click(screen.getByRole('button', { name: 'Join Partner' }));
    await user.type(screen.getByPlaceholderText('Q95N8X'), 'abc 123');
    await user.click(screen.getByRole('button', { name: 'Join Partner List' }));

    expect(onJoinCouple).toHaveBeenCalledWith('ABC123');
    expect(await screen.findByText(message)).toBeInTheDocument();
  });
});

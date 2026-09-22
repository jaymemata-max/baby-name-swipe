import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SettingsTab } from '@/components/SettingsTab';
import { makeCouple, makeProfile } from '@/test/factories';

function renderSettings(overrides: Partial<React.ComponentProps<typeof SettingsTab>> = {}) {
  const props = {
    profile: makeProfile({ couple_id: 'couple-1' }),
    couple: makeCouple(),
    partner: null,
    stats: null,
    onUpdateProfile: vi.fn().mockResolvedValue({ success: true }),
    onUpdateCouple: vi.fn().mockResolvedValue({ success: true }),
    onSignOut: vi.fn().mockResolvedValue({ success: true }),
    ...overrides,
  };
  render(<SettingsTab {...props} />);
  return props;
}

describe('SettingsTab', () => {
  it('shows profile save errors and does not claim the profile was saved', async () => {
    const user = userEvent.setup();
    const onUpdateProfile = vi.fn().mockResolvedValue({ success: false, error: 'Profile update failed' });
    renderSettings({ onUpdateProfile });

    await user.click(screen.getByRole('button', { name: 'Update Profile' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Profile update failed');
    expect(screen.queryByText('Profile Saved!')).not.toBeInTheDocument();
  });

  it('saves couple details and shows any server rejection', async () => {
    const user = userEvent.setup();
    const onUpdateCouple = vi.fn().mockResolvedValueOnce({ success: false, error: 'Date rejected' })
      .mockResolvedValueOnce({ success: true });
    renderSettings({ onUpdateCouple });

    await user.click(screen.getByRole('button', { name: 'Save Couple Info' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Date rejected');
    await user.click(screen.getByRole('button', { name: 'Save Couple Info' }));
    expect(await screen.findByRole('button', { name: 'Couple Saved!' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onUpdateCouple).toHaveBeenCalledWith('Baby Mata', null);
  });

  it('keeps Settings visible when sign-out fails', async () => {
    const user = userEvent.setup();
    renderSettings({ onSignOut: vi.fn().mockResolvedValue({ success: false, error: 'Session error' }) });

    await user.click(screen.getByRole('button', { name: 'Sign Out' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Session error');
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
  });
});

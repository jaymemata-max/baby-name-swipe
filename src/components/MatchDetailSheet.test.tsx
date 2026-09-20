import { useState } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MatchDetailSheet } from '@/components/MatchDetailSheet';
import type { MatchWithName } from '@/lib/types';
import { makeMatch } from '@/test/factories';

function DetailHarness({ first, second }: { first: MatchWithName; second: MatchWithName }) {
  const [match, setMatch] = useState<MatchWithName | null>(first);
  return (
    <>
      <button type="button" onClick={() => setMatch(second)}>Open second</button>
      <MatchDetailSheet
        match={match}
        onClose={() => setMatch(null)}
        onToggleShortlist={vi.fn()}
        onSaveNote={vi.fn()}
        onDeleteMatch={vi.fn().mockResolvedValue(true)}
      />
    </>
  );
}

describe('MatchDetailSheet', () => {
  it('closes and reopens on another match with that match note', async () => {
    const user = userEvent.setup();
    const first = makeMatch(1, { note: 'First note' });
    const second = makeMatch(2, { note: 'Second note' });

    render(<DetailHarness first={first} second={second} />);
    expect(screen.getByLabelText('Shared Note')).toHaveValue('First note');

    await user.click(screen.getByRole('button', { name: 'Close detail' }));
    expect(screen.queryByLabelText('Shared Note')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open second' }));
    expect(screen.getByLabelText('Shared Note')).toHaveValue('Second note');
    expect(screen.getByRole('heading', { name: 'Name 2' })).toBeInTheDocument();
  });
});

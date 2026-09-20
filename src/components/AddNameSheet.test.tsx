import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AddNameSheet } from '@/components/AddNameSheet';
import { jsonResponse } from '@/test/factories';

describe('AddNameSheet', () => {
  it('shows a duplicate-name conflict to the user', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (input === '/api/names?scope=custom') {
        return Promise.resolve(jsonResponse({ names: [], count: 0 }));
      }
      if (input === '/api/names' && init?.method === 'POST') {
        return Promise.resolve(jsonResponse({
          error: 'That name is already in the catalogue.',
          code: 'duplicate_name',
        }, 409));
      }
      throw new Error(`Unexpected request: ${String(input)}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AddNameSheet isOpen onClose={vi.fn()} />);
    await user.type(screen.getByPlaceholderText('e.g. Mateo, Juliette, Rowan...'), 'Mateo');
    await user.click(screen.getByRole('button', { name: 'Add to Both Decks' }));

    expect(await screen.findByText('That name is already in the catalogue.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/names',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ value: 'Mateo', gender: 'unisex' }),
      }),
    );
  });
});

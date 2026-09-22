import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DeckScreen } from '@/components/DeckScreen';
import { useDeck } from '@/hooks/useDeck';
import {
  deferred,
  jsonResponse,
  makeBabyName,
  makeDeckCard,
  makeSwipeResponse,
} from '@/test/factories';

const baseCards = Array.from({ length: 10 }, (_, index) => makeDeckCard(index + 1));

function renderDeck(onMatchCelebration = vi.fn()) {
  return render(
    <DeckScreen
      profile={null}
      couple={null}
      partner={null}
      stats={null}
      onMatchCelebration={onMatchCelebration}
      onRefreshMe={vi.fn()}
    />,
  );
}

function DeckProbe() {
  const { cards, swipe } = useDeck();
  return (
    <div>
      <output>{cards.map((card) => card.value).join('|')}</output>
      <button type="button" onClick={() => void swipe('like')}>Probe like</button>
    </div>
  );
}

describe('DeckScreen', () => {
  it('loads the full catalogue by default', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ cards: baseCards }));
    vi.stubGlobal('fetch', fetchMock);

    render(<DeckProbe />);
    await screen.findByText(/Name 1\|Name 2/);

    expect(fetchMock).toHaveBeenCalledWith('/api/deck?gender=all&limit=25');
  });

  it('opens the old default language filter without losing the gender choice', async () => {
    localStorage.setItem('baby_names_deck_filters', JSON.stringify({
      gender: 'girl', languages: ['nl', 'en', 'es'],
    }));
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ cards: baseCards }));
    vi.stubGlobal('fetch', fetchMock);

    render(<DeckProbe />);
    await screen.findByText(/Name 1\|Name 2/);

    expect(fetchMock).toHaveBeenCalledWith('/api/deck?gender=girl&limit=25');
    expect(JSON.parse(localStorage.getItem('baby_names_deck_filters') || '{}')).toEqual({
      gender: 'girl', languages: [], version: 2,
    });
  });

  it('keeps a deliberately selected language filter', async () => {
    localStorage.setItem('baby_names_deck_filters', JSON.stringify({
      gender: 'all', languages: ['es'],
    }));
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ cards: baseCards }));
    vi.stubGlobal('fetch', fetchMock);

    render(<DeckProbe />);
    await screen.findByText(/Name 1\|Name 2/);

    expect(fetchMock).toHaveBeenCalledWith('/api/deck?gender=all&limit=25&languages=es');
  });

  it('renders a card, posts the swipe body, and removes it optimistically', async () => {
    const user = userEvent.setup();
    const post = deferred<Response>();
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).startsWith('/api/deck')) {
        return Promise.resolve(jsonResponse({ cards: baseCards, count: baseCards.length }));
      }
      if (input === '/api/swipes' && init?.method === 'POST') return post.promise;
      throw new Error(`Unexpected request: ${String(input)}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderDeck();
    expect(await screen.findByText('Name 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Like this name' }));

    expect(screen.queryByText('Name 1')).not.toBeInTheDocument();
    expect(screen.getByText('Name 2')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/swipes',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name_id: 'name-1', direction: 'like' }),
      }),
    );

    post.resolve(jsonResponse(makeSwipeResponse(baseCards[0])));
    await waitFor(() => expect(screen.queryByText('Name 1')).not.toBeInTheDocument());
  });

  it('restores a failed optimistic swipe and shows the error banner', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).startsWith('/api/deck')) {
        return Promise.resolve(jsonResponse({ cards: baseCards, count: baseCards.length }));
      }
      if (input === '/api/swipes' && init?.method === 'POST') {
        return Promise.resolve(jsonResponse({ error: 'write failed' }, 500));
      }
      throw new Error(`Unexpected request: ${String(input)}`);
    }));

    renderDeck();
    await screen.findByText('Name 1');
    await user.click(screen.getByRole('button', { name: 'Like this name' }));

    expect(await screen.findByText('Could not record swipe. Restored the card.')).toBeInTheDocument();
    expect(screen.getByText('Name 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it.each([
    { matched: true, matched_now: true, expected: 1 },
    { matched: true, matched_now: false, expected: 0 },
  ])('uses matched_now for celebrations: $matched_now', async ({ matched, matched_now, expected }) => {
    const user = userEvent.setup();
    const onMatchCelebration = vi.fn();
    const response = makeSwipeResponse(baseCards[0], {
      matched,
      matched_now,
      match: { id: 'match-1', is_love: false, shortlisted: false },
      name: makeBabyName(1),
    });
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).startsWith('/api/deck')) {
        return Promise.resolve(jsonResponse({ cards: baseCards, count: baseCards.length }));
      }
      if (input === '/api/swipes' && init?.method === 'POST') {
        return Promise.resolve(jsonResponse(response));
      }
      throw new Error(`Unexpected request: ${String(input)}`);
    }));

    renderDeck(onMatchCelebration);
    await screen.findByText('Name 1');
    await user.click(screen.getByRole('button', { name: 'Like this name' }));

    await waitFor(() => expect(onMatchCelebration).toHaveBeenCalledTimes(expected));
  });

  it('restores the undone card and reports a 404 instead of failing silently', async () => {
    const user = userEvent.setup();
    let undoAttempts = 0;
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).startsWith('/api/deck')) {
        return Promise.resolve(jsonResponse({ cards: baseCards, count: baseCards.length }));
      }
      if (input === '/api/swipes' && init?.method === 'POST') {
        return Promise.resolve(jsonResponse(makeSwipeResponse(baseCards[0])));
      }
      if (input === '/api/swipes' && init?.method === 'DELETE') {
        undoAttempts += 1;
        if (undoAttempts === 1) {
          return Promise.resolve(jsonResponse({
            undone: true,
            name_id: 'name-1',
            name: makeBabyName(1),
          }));
        }
        return Promise.resolve(jsonResponse({ error: 'Nothing to undo', code: 'nothing_to_undo' }, 404));
      }
      throw new Error(`Unexpected request: ${String(input)}`);
    }));

    renderDeck();
    await screen.findByText('Name 1');
    await user.click(screen.getByRole('button', { name: 'Like this name' }));
    await user.click(screen.getByRole('button', { name: 'Undo last swipe' }));
    expect(await screen.findByText('Name 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Undo last swipe' }));
    expect(await screen.findByText('No recent swipe to undo')).toBeInTheDocument();
  });

  it('prefetches at eight cards without losing appended cards during a swipe', async () => {
    const user = userEvent.setup();
    const initialCards = baseCards.slice(0, 8);
    const appendedCards = [makeDeckCard(11), makeDeckCard(12)];
    const prefetch = deferred<Response>();
    let deckRequests = 0;
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).startsWith('/api/deck')) {
        deckRequests += 1;
        if (deckRequests === 1) {
          return Promise.resolve(jsonResponse({ cards: initialCards, count: initialCards.length }));
        }
        return prefetch.promise;
      }
      if (input === '/api/swipes' && init?.method === 'POST') {
        return Promise.resolve(jsonResponse(makeSwipeResponse(initialCards[0])));
      }
      throw new Error(`Unexpected request: ${String(input)}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<DeckProbe />);
    await screen.findByText(/Name 1\|Name 2/);
    await waitFor(() => expect(deckRequests).toBe(2));

    await user.click(screen.getByRole('button', { name: 'Probe like' }));
    expect(screen.queryByText(/Name 1\|/)).not.toBeInTheDocument();

    prefetch.resolve(jsonResponse({ cards: appendedCards, count: appendedCards.length }));
    expect(await screen.findByText(/Name 11\|Name 12/)).toBeInTheDocument();
    expect(screen.getByText(/Name 2/)).toBeInTheDocument();
  });

  it('stops prefetching when the server has no unseen cards left', async () => {
    const initialCards = baseCards.slice(0, 8);
    const duplicatePrefetch = deferred<Response>();
    let deckRequests = 0;
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      if (String(input).startsWith('/api/deck')) {
        deckRequests += 1;
        if (deckRequests === 2) return duplicatePrefetch.promise;
        return Promise.resolve(jsonResponse({ cards: initialCards, count: initialCards.length }));
      }
      throw new Error(`Unexpected request: ${String(input)}`);
    }));

    render(<DeckProbe />);
    await screen.findByText(/Name 1\|Name 2/);
    await waitFor(() => expect(deckRequests).toBe(2));
    duplicatePrefetch.resolve(jsonResponse({ cards: initialCards, count: initialCards.length }));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(deckRequests).toBe(2);
  });
});

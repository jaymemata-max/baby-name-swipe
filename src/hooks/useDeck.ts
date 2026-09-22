"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { DeckCard, SwipeDirection } from '@/lib/supabase/database.types';
import { DeckFilterPreferences, SwipeResponse, UndoSwipeResponse } from '@/lib/types';

const DEFAULT_FILTERS: DeckFilterPreferences = {
  gender: 'all',
  languages: [],
};

const STORAGE_KEY = 'baby_names_deck_filters';

function loadStoredFilters(): DeckFilterPreferences {
  if (typeof window === 'undefined') return DEFAULT_FILTERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FILTERS;
    const parsed = JSON.parse(raw);
    const languages = Array.isArray(parsed.languages) ? parsed.languages : [];
    const wasOldDefault = !parsed.version && languages.length === 3 &&
      ['nl', 'en', 'es'].every((lang) => languages.includes(lang));
    return {
      gender: parsed.gender || 'all',
      languages: wasOldDefault ? [] : languages,
    };
  } catch {
    return DEFAULT_FILTERS;
  }
}

export function useDeck(onMatchCelebration?: (data: SwipeResponse) => void) {
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swipedCount, setSwipedCount] = useState(0);
  const [filters, setFilters] = useState<DeckFilterPreferences>(loadStoredFilters);

  // Keep track of recent swipes for visual undo
  const swipeHistory = useRef<{ card: DeckCard; direction: SwipeDirection }[]>([]);
  const isFetchingRef = useRef(false);
  const prefetchExhaustedRef = useRef(false);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...filters, version: 2 }));
    } catch {
      // ignore
    }
  }, [filters]);

  const fetchDeck = useCallback(async (append = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!append) {
      prefetchExhaustedRef.current = false;
      setLoading(true);
    }
    else setIsPrefetching(true);

    setError(null);
    try {
      const langsParam = filters.languages.join(',');
      const params = new URLSearchParams({
        gender: filters.gender,
        limit: '25',
      });
      if (langsParam) {
        params.append('languages', langsParam);
      }

      const res = await fetch(`/api/deck?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `HTTP error ${res.status}`);
      }
      const data = await res.json();
      const newCards: DeckCard[] = data.cards || [];

      setCards((prev) => {
        if (!append) return newCards;
        // Append unique cards that aren't already in stack
        const existingIds = new Set(prev.map((c) => c.id));
        const filteredNew = newCards.filter((c) => !existingIds.has(c.id));
        prefetchExhaustedRef.current = filteredNew.length === 0;
        return [...prev, ...filteredNew];
      });
    } catch (err: unknown) {
      if (append) prefetchExhaustedRef.current = true;
      setError(err instanceof Error ? err.message : 'Failed to load deck');
    } finally {
      setLoading(false);
      setIsPrefetching(false);
      isFetchingRef.current = false;
    }
  }, [filters]);

  // Initial fetch and fetch when filters change
  useEffect(() => {
    fetchDeck(false);
  }, [fetchDeck]);

  // Prefetch when <= 8 cards remain in deck
  useEffect(() => {
    if (
      !loading &&
      !isPrefetching &&
      !prefetchExhaustedRef.current &&
      cards.length > 0 &&
      cards.length <= 8
    ) {
      fetchDeck(true);
    }
  }, [cards.length, loading, isPrefetching, fetchDeck]);

  // Optimistic swipe handler
  const swipe = useCallback(async (direction: SwipeDirection): Promise<SwipeResponse | null> => {
    if (cards.length === 0) return null;

    const currentCard = cards[0];

    // Remove it functionally rather than writing back a captured array: a
    // prefetch may have appended cards since this closure was created, and
    // setCards(cards.slice(1)) would silently discard them.
    setCards((prev) => prev.filter((c) => c.id !== currentCard.id));
    setSwipedCount((prev) => prev + 1);
    swipeHistory.current.push({ card: currentCard, direction });

    try {
      const res = await fetch('/api/swipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_id: currentCard.id,
          direction,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to record swipe');
      }

      const data: SwipeResponse = await res.json();

      // The partner learns about this through Supabase Realtime on `matches`,
      // which the trigger writes to. Nothing to broadcast from here.
      if (data.matched_now && onMatchCelebration) {
        onMatchCelebration(data);
      }

      return data;
    } catch (err) {
      console.error('Optimistic swipe failed, rolling back card', err);
      // Roll back visually if request failed
      setCards((prev) => [currentCard, ...prev]);
      setSwipedCount((prev) => Math.max(0, prev - 1));
      swipeHistory.current.pop();
      setError('Could not record swipe. Restored the card.');
      return null;
    }
  }, [cards, onMatchCelebration]);

  // Undo most recent swipe
  const undo = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/swipes', {
        method: 'DELETE',
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        if (res.status === 404) {
          setError('No recent swipe to undo');
        } else {
          setError(json.error || 'Failed to undo');
        }
        return false;
      }

      const data: UndoSwipeResponse = await res.json();

      // The API hands back a plain name row, so rebuild the deck card. The
      // undone swipe is gone, which means the partner cannot have matched it.
      const restored = data.name;
      if (restored) {
        const card: DeckCard = {
          id: restored.id,
          value: restored.value,
          gender: restored.gender,
          origin: restored.origin,
          meaning: restored.meaning,
          popularity: restored.popularity,
          works_in: restored.works_in,
          is_custom: restored.couple_id !== null,
          partner_liked: false,
        };
        setCards((prev) => [card, ...prev]);
        setSwipedCount((prev) => Math.max(0, prev - 1));
      } else {
        await fetchDeck(false);
      }
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error undoing swipe');
      return false;
    }
  }, [fetchDeck]);

  const updateFilters = (newFilters: Partial<DeckFilterPreferences>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  return {
    cards,
    topCard: cards[0] || null,
    currentCard: cards[0] || null,
    nextCard: cards[1] || null,
    thirdCard: cards[2] || null,
    loading,
    error,
    swipedCount,
    canUndo: swipeHistory.current.length > 0 || swipedCount > 0,
    filters,
    updateFilters,
    swipe,
    undo,
    reload: () => fetchDeck(false),
    reloadDeck: () => fetchDeck(false),
  };
}

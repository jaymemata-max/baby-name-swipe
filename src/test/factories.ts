import type {
  BabyName,
  Couple,
  DeckCard,
  Profile,
} from '@/lib/supabase/database.types';
import type { MatchWithName, SwipeResponse } from '@/lib/types';

export function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

export function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

export function makeDeckCard(index = 1, overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id: `name-${index}`,
    value: `Name ${index}`,
    gender: index % 2 === 0 ? 'boy' : 'girl',
    origin: 'Dutch',
    meaning: `Meaning ${index}`,
    popularity: index,
    works_in: ['nl', 'en', 'es'],
    is_custom: false,
    partner_liked: false,
    ...overrides,
  };
}

export function makeBabyName(index = 1, overrides: Partial<BabyName> = {}): BabyName {
  return {
    id: `name-${index}`,
    couple_id: null,
    value: `Name ${index}`,
    gender: index % 2 === 0 ? 'boy' : 'girl',
    origin: 'Dutch',
    meaning: `Meaning ${index}`,
    popularity: index,
    works_in: ['nl', 'en', 'es'],
    created_at: '2026-09-20T10:00:00.000Z',
    ...overrides,
  };
}

export function makeMatch(index = 1, overrides: Partial<MatchWithName> = {}): MatchWithName {
  const name = overrides.name ?? makeBabyName(index);
  return {
    id: `match-${index}`,
    couple_id: 'couple-1',
    name_id: name.id,
    is_love: false,
    shortlisted: false,
    note: null,
    created_at: '2026-09-20T10:00:00.000Z',
    ...overrides,
    name,
  };
}

export function makeSwipeResponse(
  card: DeckCard,
  overrides: Partial<SwipeResponse> = {},
): SwipeResponse {
  return {
    swipe: {
      id: `swipe-${card.id}`,
      profile_id: 'profile-1',
      name_id: card.id,
      direction: 'like',
    },
    matched: false,
    matched_now: false,
    match: null,
    name: null,
    ...overrides,
  };
}

export function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'profile-1',
    couple_id: null,
    display_name: 'Jayme',
    avatar_emoji: 'J',
    created_at: '2026-09-20T10:00:00.000Z',
    ...overrides,
  };
}

export function makeCouple(overrides: Partial<Couple> = {}): Couple {
  return {
    id: 'couple-1',
    title: 'Baby Mata',
    invite_code: 'Q95N8X',
    due_date: null,
    created_at: '2026-09-20T10:00:00.000Z',
    ...overrides,
  };
}

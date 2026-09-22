import {
  Profile,
  Couple,
  CoupleStats,
  DeckCard,
  Match,
  BabyName,
  SwipeDirection,
  NameGender,
  NameLanguage,
} from '@/lib/supabase/database.types';

export interface MeResponse {
  profile: Profile | null;
  couple: Couple | null;
  partner: {
    id: string;
    display_name: string;
    avatar_emoji: string;
  } | null;
  stats: CoupleStats | null;
}

export interface DeckResponse {
  cards: DeckCard[];
  count: number;
  gender: string;
  languages: NameLanguage[];
}

export interface SwipeResponse {
  swipe: {
    id: string;
    /** The API calls this profile_id, not user_id. */
    profile_id: string;
    name_id: string;
    direction: SwipeDirection;
    created_at?: string;
  };
  matched: boolean;
  matched_now: boolean;
  match: {
    id: string;
    is_love: boolean;
    shortlisted: boolean;
  } | null;
  /** null unless matched is true. */
  name: BabyName | null;
}

export interface UndoSwipeResponse {
  undone: boolean;
  name_id: string;
  /** A plain name row, not a deck card: no is_custom or partner_liked on it. */
  name: BabyName | null;
}

/**
 * A match row with its name joined in, which is what /api/matches returns.
 * `name` is never null: matches.name_id is NOT NULL with a foreign key to
 * names, so the join always resolves.
 */
export type MatchWithName = Match & { name: BabyName };

export interface MatchesResponse {
  matches: MatchWithName[];
  count: number;
}

export interface CustomNamesResponse {
  names: BabyName[];
  count: number;
}

export interface ApiError {
  error: string;
  code?: string;
}

export interface DeckFilterPreferences {
  gender: 'all' | 'boy' | 'girl' | 'unisex';
  languages: NameLanguage[];
}

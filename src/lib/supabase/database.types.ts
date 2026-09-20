/**
 * Hand-maintained mirror of the SQL schema.
 * Regenerate with: npm run db:types (requires the Supabase CLI + local stack).
 */

export type NameGender = "boy" | "girl" | "unisex";
export type NameLanguage = "en" | "es" | "nl" | "fr";
export type SwipeDirection = "pass" | "like" | "love";

export type Couple = {
  id: string;
  title: string;
  invite_code: string;
  due_date: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  couple_id: string | null;
  display_name: string;
  avatar_emoji: string;
  created_at: string;
};

export type BabyName = {
  id: string;
  couple_id: string | null;
  value: string;
  gender: NameGender;
  origin: string | null;
  meaning: string | null;
  popularity: number | null;
  /** Languages a native speaker can pronounce this name naturally in. */
  works_in: NameLanguage[];
  created_at: string;
};

export type Swipe = {
  id: string;
  couple_id: string;
  profile_id: string;
  name_id: string;
  direction: SwipeDirection;
  created_at: string;
  updated_at: string;
};

export type Match = {
  id: string;
  couple_id: string;
  name_id: string;
  is_love: boolean;
  shortlisted: boolean;
  note: string | null;
  created_at: string;
};

export type DeckCard = {
  id: string;
  value: string;
  gender: NameGender;
  origin: string | null;
  meaning: string | null;
  popularity: number | null;
  works_in: NameLanguage[];
  is_custom: boolean;
  partner_liked: boolean;
};

export type CoupleStats = {
  total_names: number;
  my_swipes: number;
  partner_swipes: number;
  my_likes: number;
  matches: number;
  shortlisted: number;
};

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      couples: Table<Couple, Partial<Couple> & { invite_code: string }, Partial<Couple>>;
      profiles: Table<Profile, Partial<Profile> & { id: string; display_name: string }, Partial<Profile>>;
      names: Table<BabyName, Partial<BabyName> & { value: string; gender: NameGender }, Partial<BabyName>>;
      swipes: Table<
        Swipe,
        { couple_id: string; profile_id: string; name_id: string; direction: SwipeDirection },
        Partial<Swipe>
      >;
      matches: Table<Match, never, Partial<Match>>;
    };
    Views: Record<string, never>;
    Functions: {
      create_couple: { Args: { p_title?: string | null }; Returns: Couple };
      join_couple: { Args: { p_invite_code: string }; Returns: Couple };
      leave_couple: { Args: Record<string, never>; Returns: undefined };
      reject_match: { Args: { p_name_id: string }; Returns: undefined };
      get_deck: {
        Args: { p_gender?: string; p_limit?: number; p_languages?: string[] | null };
        Returns: DeckCard[];
      };
      couple_stats: { Args: Record<string, never>; Returns: CoupleStats[] };
    };
    Enums: {
      name_gender: NameGender;
      swipe_direction: SwipeDirection;
    };
    CompositeTypes: Record<string, never>;
  };
};

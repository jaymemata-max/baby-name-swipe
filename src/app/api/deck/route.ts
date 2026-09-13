import { ApiError, ok, requireCouple, route } from "@/lib/api";
import { deckQuerySchema } from "@/lib/schemas";
import type { DeckCard } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

/**
 * The next cards to swipe: names this user has not judged yet.
 * Names the partner already liked come back first, so matches surface fast.
 *
 * GET /api/deck?gender=boy&limit=25
 */
export async function GET(request: Request) {
  return route(async () => {
    const { supabase } = await requireCouple();

    const url = new URL(request.url);
    const parsed = deckQuerySchema.safeParse({
      gender: url.searchParams.get("gender") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      throw new ApiError(422, "gender must be all|boy|girl|unisex, limit 1-100");
    }

    const { data, error } = await supabase.rpc("get_deck", {
      p_gender: parsed.data.gender,
      p_limit: parsed.data.limit,
    });

    if (error) throw new ApiError(400, error.message);

    const cards = (data ?? []) as DeckCard[];
    return ok({ cards, count: cards.length, gender: parsed.data.gender });
  });
}

import { ApiError, ok, requireCouple, route } from "@/lib/api";
import { deckQuerySchema } from "@/lib/schemas";
import type { DeckCard } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

/**
 * The next cards to swipe: names this user has not judged yet.
 *
 * GET /api/deck?gender=boy&limit=25&languages=en,es,nl
 *
 * `languages` deals only names a native speaker of every listed language can
 * pronounce naturally. Leave it off to see the whole catalogue. Names the
 * couple added themselves always come through, filter or not.
 */
export async function GET(request: Request) {
  return route(async () => {
    const { supabase } = await requireCouple();

    const url = new URL(request.url);
    const parsed = deckQuerySchema.safeParse({
      gender: url.searchParams.get("gender") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      languages: url.searchParams.get("languages") ?? undefined,
    });

    if (!parsed.success) {
      throw new ApiError(
        422,
        "gender must be all|boy|girl|unisex, limit 1-100, languages a comma-separated subset of en,es,nl,fr,pt",
      );
    }

    const { gender, limit, languages } = parsed.data;

    const { data, error } = await supabase.rpc("get_deck", {
      p_gender: gender,
      p_limit: limit,
      p_languages: languages.length > 0 ? languages : null,
    });

    if (error) throw new ApiError(400, error.message);

    const cards = (data ?? []) as DeckCard[];
    return ok({ cards, count: cards.length, gender, languages });
  });
}

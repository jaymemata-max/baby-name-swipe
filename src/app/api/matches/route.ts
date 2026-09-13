import { ApiError, ok, requireCouple, route } from "@/lib/api";
import { matchesQuerySchema } from "@/lib/schemas";
import type { BabyName, Match } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

type MatchRow = Match & { name: BabyName | null };

/**
 * Names you both said yes to.
 * GET /api/matches?gender=girl&shortlisted=true
 */
export async function GET(request: Request) {
  return route(async () => {
    const { supabase, coupleId } = await requireCouple();

    const url = new URL(request.url);
    const parsed = matchesQuerySchema.safeParse({
      shortlisted: url.searchParams.get("shortlisted") ?? undefined,
      gender: url.searchParams.get("gender") ?? undefined,
    });

    if (!parsed.success) {
      throw new ApiError(422, "shortlisted must be true|false, gender all|boy|girl|unisex");
    }

    let query = supabase
      .from("matches")
      .select("*, name:names(*)")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false });

    if (parsed.data.shortlisted !== undefined) {
      query = query.eq("shortlisted", parsed.data.shortlisted);
    }

    const { data, error } = await query;
    if (error) throw new ApiError(400, error.message);

    let matches = (data ?? []) as unknown as MatchRow[];

    if (parsed.data.gender !== "all") {
      matches = matches.filter((match) => match.name?.gender === parsed.data.gender);
    }

    return ok({ matches, count: matches.length });
  });
}

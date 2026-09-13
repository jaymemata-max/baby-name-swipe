import { ApiError, ok, parseBody, requireCouple, route } from "@/lib/api";
import { swipeSchema } from "@/lib/schemas";
import type { BabyName, Match, Swipe } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

const LIKED: ReadonlyArray<string> = ["like", "love"];

/**
 * Record a swipe. Re-swiping the same name overwrites the old answer, so
 * changing your mind is a normal write rather than a special case.
 *
 * Matching itself happens in a Postgres trigger, which keeps the two of you
 * consistent even if both swipe the same name at the same moment.
 */
export async function POST(request: Request) {
  return route(async () => {
    const { supabase, userId, coupleId } = await requireCouple();
    const { name_id, direction } = await parseBody(request, swipeSchema);

    // RLS scopes this to our couple, so it returns at most my row and my
    // partner's row for this name.
    const { data: existing, error: existingError } = await supabase
      .from("swipes")
      .select("profile_id, direction")
      .eq("name_id", name_id);

    if (existingError) throw new ApiError(400, existingError.message);

    const rows = (existing ?? []) as Pick<Swipe, "profile_id" | "direction">[];
    const mine = rows.find((row) => row.profile_id === userId);
    const partner = rows.find((row) => row.profile_id !== userId);

    const partnerLiked = partner ? LIKED.includes(partner.direction) : false;
    const hadMatch = partnerLiked && mine ? LIKED.includes(mine.direction) : false;

    const { data: swipe, error } = await supabase
      .from("swipes")
      .upsert(
        { couple_id: coupleId, profile_id: userId, name_id, direction },
        { onConflict: "profile_id,name_id" },
      )
      .select("*")
      .single();

    if (error) {
      if (error.code === "23503") throw new ApiError(404, "That name does not exist");
      throw new ApiError(400, error.message);
    }

    const isMatch = partnerLiked && LIKED.includes(direction);
    const matchedNow = isMatch && !hadMatch;

    if (!isMatch) {
      return ok({ swipe, matched: false, matched_now: false, match: null, name: null });
    }

    const [matchResult, nameResult] = await Promise.all([
      supabase.from("matches").select("*").eq("name_id", name_id).maybeSingle(),
      supabase.from("names").select("*").eq("id", name_id).single(),
    ]);

    return ok({
      swipe,
      matched: true,
      matched_now: matchedNow,
      match: (matchResult.data as Match | null) ?? null,
      name: (nameResult.data as BabyName | null) ?? null,
    });
  });
}

/**
 * Undo. With ?name_id= it removes that specific swipe, otherwise it removes
 * your most recent one and hands the card back so the UI can re-show it.
 */
export async function DELETE(request: Request) {
  return route(async () => {
    const { supabase, userId } = await requireCouple();
    const requested = new URL(request.url).searchParams.get("name_id");

    let nameId = requested;

    if (!nameId) {
      const { data: last } = await supabase
        .from("swipes")
        .select("name_id")
        .eq("profile_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!last) throw new ApiError(404, "Nothing to undo", "nothing_to_undo");
      nameId = last.name_id;
    }

    const { error } = await supabase
      .from("swipes")
      .delete()
      .eq("profile_id", userId)
      .eq("name_id", nameId);

    if (error) throw new ApiError(400, error.message);

    const { data: name } = await supabase
      .from("names")
      .select("*")
      .eq("id", nameId)
      .maybeSingle();

    return ok({ undone: true, name_id: nameId, name: (name as BabyName | null) ?? null });
  });
}

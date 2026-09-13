import { ok, parseBody, requireSession, route } from "@/lib/api";
import { updateProfileSchema } from "@/lib/schemas";
import type { CoupleStats } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

/** Everything the app needs on boot: who I am, my couple, my partner, my counters. */
export async function GET() {
  return route(async () => {
    const { supabase, profile } = await requireSession();

    if (!profile.couple_id) {
      return ok({ profile, couple: null, partner: null, stats: null });
    }

    const [coupleResult, membersResult, statsResult] = await Promise.all([
      supabase.from("couples").select("*").eq("id", profile.couple_id).single(),
      supabase.from("profiles").select("*").eq("couple_id", profile.couple_id),
      supabase.rpc("couple_stats"),
    ]);

    const partner =
      membersResult.data?.find((member) => member.id !== profile.id) ?? null;

    const stats = (statsResult.data as CoupleStats[] | null)?.[0] ?? null;

    return ok({ profile, couple: coupleResult.data ?? null, partner, stats });
  });
}

/** Rename yourself or pick a different emoji. */
export async function PATCH(request: Request) {
  return route(async () => {
    const { supabase, userId } = await requireSession();
    const patch = await parseBody(request, updateProfileSchema);

    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", userId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return ok({ profile: data });
  });
}

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ok, route } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Cheap liveness probe that also touches Postgres.
 * The keep-alive workflow pings this so the free Supabase project never
 * hits the 7-day inactivity pause.
 */
export async function GET() {
  return route(async () => {
    const supabase = await createSupabaseServerClient();
    const { count, error } = await supabase
      .from("names")
      .select("id", { count: "exact", head: true })
      .is("couple_id", null);

    return ok({
      status: error ? "degraded" : "ok",
      names_in_catalogue: count ?? 0,
      checked_at: new Date().toISOString(),
    });
  });
}

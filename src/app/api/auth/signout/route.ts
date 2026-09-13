import { ok, route } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return route(async () => {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    return ok({ signed_out: true });
  });
}

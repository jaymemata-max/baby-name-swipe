import { ok, parseBody, requireSession, route, rpcError } from "@/lib/api";
import { joinCoupleSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

/**
 * Join your partner's couple with their 6-character invite code.
 * Any swiping you already did on your own moves across with you.
 */
export async function POST(request: Request) {
  return route(async () => {
    const { supabase } = await requireSession();
    const { invite_code } = await parseBody(request, joinCoupleSchema);

    const { data, error } = await supabase.rpc("join_couple", {
      p_invite_code: invite_code,
    });

    if (error) throw rpcError(error.message);
    return ok({ couple: data });
  });
}

import { ApiError, ok, parseBody, requireCouple, route } from "@/lib/api";
import { updateMatchSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Shortlist a match or leave a note on it. */
export async function PATCH(request: Request, { params }: Params) {
  return route(async () => {
    const { supabase, coupleId } = await requireCouple();
    const { id } = await params;
    const patch = await parseBody(request, updateMatchSchema);

    const { data, error } = await supabase
      .from("matches")
      .update(patch)
      .eq("id", id)
      .eq("couple_id", coupleId)
      .select("*, name:names(*)")
      .maybeSingle();

    if (error) throw new ApiError(400, error.message);
    if (!data) throw new ApiError(404, "Match not found");

    return ok({ match: data });
  });
}

/**
 * Rule a name out together. Both partners' likes flip to a pass, so the match
 * disappears and the name does not come back around in either deck.
 */
export async function DELETE(request: Request, { params }: Params) {
  return route(async () => {
    const { supabase, coupleId } = await requireCouple();
    const { id } = await params;

    const { data: match, error: readError } = await supabase
      .from("matches")
      .select("id, name_id")
      .eq("id", id)
      .eq("couple_id", coupleId)
      .maybeSingle();

    if (readError) throw new ApiError(400, readError.message);
    if (!match) throw new ApiError(404, "Match not found");

    const { error } = await supabase.rpc("reject_match", { p_name_id: match.name_id });
    if (error) throw new ApiError(400, error.message);

    return ok({ deleted: true, name_id: match.name_id });
  });
}

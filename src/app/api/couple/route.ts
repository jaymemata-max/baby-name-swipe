import {
  ApiError,
  ok,
  parseBody,
  requireCouple,
  requireSession,
  route,
  rpcError,
} from "@/lib/api";
import { createCoupleSchema, updateCoupleSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

/** The couple I belong to, with both members. */
export async function GET() {
  return route(async () => {
    const { supabase, coupleId } = await requireCouple();

    const [couple, members] = await Promise.all([
      supabase.from("couples").select("*").eq("id", coupleId).single(),
      supabase.from("profiles").select("*").eq("couple_id", coupleId),
    ]);

    if (couple.error) throw new ApiError(404, "Couple not found");
    return ok({ couple: couple.data, members: members.data ?? [] });
  });
}

/** Start a new couple and get the invite code to send to your partner. */
export async function POST(request: Request) {
  return route(async () => {
    const { supabase } = await requireSession();
    const { title } = await parseBody(request, createCoupleSchema);

    const { data, error } = await supabase.rpc("create_couple", {
      p_title: title ?? null,
    });

    if (error) throw rpcError(error.message);
    return ok({ couple: data }, 201);
  });
}

/** Rename the list or set the due date. */
export async function PATCH(request: Request) {
  return route(async () => {
    const { supabase, coupleId } = await requireCouple();
    const patch = await parseBody(request, updateCoupleSchema);

    const { data, error } = await supabase
      .from("couples")
      .update(patch)
      .eq("id", coupleId)
      .select("*")
      .single();

    if (error) throw new ApiError(400, error.message);
    return ok({ couple: data });
  });
}

/** Leave the couple. Swipes and matches stay put for the other person. */
export async function DELETE() {
  return route(async () => {
    const { supabase } = await requireCouple();
    const { error } = await supabase.rpc("leave_couple");
    if (error) throw rpcError(error.message);
    return ok({ left: true });
  });
}

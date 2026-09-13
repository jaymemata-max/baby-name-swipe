import { ApiError, ok, requireCouple, route } from "@/lib/api";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Remove a name you added. Only custom names can go: RLS blocks deletes
 * against the shared catalogue, so one couple can never break another's deck.
 */
export async function DELETE(request: Request, { params }: Params) {
  return route(async () => {
    const { supabase, coupleId } = await requireCouple();
    const { id } = await params;

    const { data, error } = await supabase
      .from("names")
      .delete()
      .eq("id", id)
      .eq("couple_id", coupleId)
      .select("id")
      .maybeSingle();

    if (error) throw new ApiError(400, error.message);
    if (!data) throw new ApiError(404, "Custom name not found", "not_your_name");

    return ok({ deleted: true, id });
  });
}

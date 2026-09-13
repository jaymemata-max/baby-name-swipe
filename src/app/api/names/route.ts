import { ApiError, ok, parseBody, requireCouple, route } from "@/lib/api";
import { createNameSchema, genderFilterSchema } from "@/lib/schemas";
import type { BabyName } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

/**
 * The names you added yourselves.
 * GET /api/names?gender=boy&scope=custom|all
 */
export async function GET(request: Request) {
  return route(async () => {
    const { supabase, coupleId } = await requireCouple();
    const url = new URL(request.url);

    const gender = genderFilterSchema.safeParse(url.searchParams.get("gender") ?? "all");
    if (!gender.success) throw new ApiError(422, "gender must be all|boy|girl|unisex");

    const scope = url.searchParams.get("scope") === "all" ? "all" : "custom";

    let query = supabase.from("names").select("*").order("value");
    query = scope === "custom" ? query.eq("couple_id", coupleId) : query;
    if (gender.data !== "all") query = query.eq("gender", gender.data);

    const { data, error } = await query;
    if (error) throw new ApiError(400, error.message);

    return ok({ names: (data ?? []) as BabyName[], scope, gender: gender.data });
  });
}

/**
 * Add a name of your own. It joins the deck for both of you immediately.
 * The person adding it does not get an automatic like - they still swipe it,
 * otherwise "we both chose this" would not mean anything.
 */
export async function POST(request: Request) {
  return route(async () => {
    const { supabase, coupleId } = await requireCouple();
    const body = await parseBody(request, createNameSchema);

    const { data, error } = await supabase
      .from("names")
      .insert({
        couple_id: coupleId,
        value: body.value,
        gender: body.gender,
        origin: body.origin ?? null,
        meaning: body.meaning ?? null,
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new ApiError(409, `${body.value} is already on your list`, "duplicate_name");
      }
      throw new ApiError(400, error.message);
    }

    return ok({ name: data as BabyName }, 201);
  });
}

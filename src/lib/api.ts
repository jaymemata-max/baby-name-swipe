import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ZodError, type ZodType } from "zod";

import { createSupabaseServerClient } from "./supabase/server";
import type { Database, Profile } from "./supabase/database.types";

export type Supabase = SupabaseClient<Database>;

export type Session = {
  supabase: Supabase;
  userId: string;
  profile: Profile;
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(status: number, message: string, code?: string) {
  return NextResponse.json({ error: message, code }, { status });
}

/** Resolves the signed-in user and their profile, or throws a 401. */
export async function requireSession(): Promise<Session> {
  const supabase = await createSupabaseServerClient();

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    throw new ApiError(401, "Sign in first", "not_authenticated");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .single();

  if (error || !profile) {
    throw new ApiError(404, "Profile not found", "no_profile");
  }

  return { supabase, userId: auth.user.id, profile };
}

/** Same as requireSession, but also insists the user has joined a couple. */
export async function requireCouple(): Promise<Session & { coupleId: string }> {
  const session = await requireSession();
  if (!session.profile.couple_id) {
    throw new ApiError(409, "Create or join a couple first", "no_couple");
  }
  return { ...session, coupleId: session.profile.couple_id };
}

export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError(400, "Expected a JSON body", "bad_json");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ApiError(422, formatZodError(result.error), "validation_failed");
  }
  return result.data;
}

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
    .join("; ");
}

/** Wraps a route handler so thrown ApiErrors become clean JSON responses. */
export function route(handler: () => Promise<Response>) {
  return handler().catch((error: unknown) => {
    if (error instanceof ApiError) {
      return fail(error.status, error.message, error.code);
    }
    console.error("Unhandled API error", error);
    return fail(500, "Something went wrong on our side", "internal_error");
  });
}

/** Maps a Postgres error from an RPC onto a sensible HTTP status. */
export function rpcError(message: string): ApiError {
  const normalised = message.toLowerCase();
  if (normalised.includes("not authenticated")) return new ApiError(401, message);
  if (normalised.includes("invalid invite code")) {
    return new ApiError(404, "That invite code does not exist", "invalid_invite_code");
  }
  if (normalised.includes("already has two people")) {
    return new ApiError(409, "That couple is already full", "couple_full");
  }
  if (normalised.includes("already in a couple")) {
    return new ApiError(409, "You are already in a couple", "already_coupled");
  }
  return new ApiError(400, message);
}

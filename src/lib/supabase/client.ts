"use client";

import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;
let magicLinkClient: ReturnType<typeof createClient<Database>> | undefined;

/** Singleton browser client, used for auth and realtime match notifications. */
export function createSupabaseBrowserClient() {
  client ??= createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return client;
}

/**
 * Starts an implicit magic-link flow so a link requested in the installed PWA
 * can be opened by Mail in Safari without sharing a PKCE verifier.
 */
export function createSupabaseMagicLinkClient() {
  magicLinkClient ??= createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        flowType: "implicit",
        persistSession: false,
        storageKey: "baby-names-magic-link",
      },
    },
  );
  return magicLinkClient;
}

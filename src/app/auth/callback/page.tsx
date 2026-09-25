"use client";

import { Heart } from "lucide-react";
import { useEffect } from "react";

import { completeAuthCallback, parseAuthCallback } from "@/lib/auth-callback";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  useEffect(() => {
    let active = true;

    async function finishSignIn() {
      const input = parseAuthCallback(new URL(window.location.href));

      // Tokens and one-time codes must disappear before the cookie client is
      // created, otherwise it tries to auto-detect a different auth flow.
      window.history.replaceState(null, "", "/auth/callback");

      if (input.kind === "error") {
        window.location.replace("/?error=auth_failed");
        return;
      }
      if (input.kind === "missing") {
        window.location.replace("/?error=missing_code");
        return;
      }

      const ok = await completeAuthCallback(input, createSupabaseBrowserClient());
      if (active) {
        window.location.replace(ok ? "/" : "/?error=auth_failed");
      }
    }

    void finishSignIn();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="h-[100dvh] w-full flex flex-col items-center justify-center bg-[#fff7f4] dark:bg-[#191117] text-[#2b1b24] dark:text-[#f5edf2]">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 flex items-center justify-center text-white shadow-xl shadow-rose-500/20 animate-pulse mb-4">
        <Heart className="w-8 h-8 fill-white stroke-none" />
      </div>
      <h1 className="text-2xl font-serif-name font-bold">Baby Names</h1>
      <p className="text-xs text-[#7e6776] dark:text-[#a895a2] mt-1">Signing you in...</p>
    </main>
  );
}

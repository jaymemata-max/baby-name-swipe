import { describe, expect, it, vi } from "vitest";

import { completeAuthCallback, parseAuthCallback } from "@/lib/auth-callback";

function makeClient() {
  return {
    auth: {
      setSession: vi.fn().mockResolvedValue({ error: null }),
      exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
    },
  };
}

describe("auth callback", () => {
  it("reads an implicit session from the URL fragment", () => {
    expect(
      parseAuthCallback(
        new URL("https://baby.example/auth/callback#access_token=access&refresh_token=refresh"),
      ),
    ).toEqual({ kind: "implicit", accessToken: "access", refreshToken: "refresh" });
  });

  it("keeps accepting existing PKCE callback links", () => {
    expect(parseAuthCallback(new URL("https://baby.example/auth/callback?code=one-time"))).toEqual({
      kind: "pkce",
      code: "one-time",
    });
  });

  it("does not accept incomplete or failed callbacks", () => {
    expect(parseAuthCallback(new URL("https://baby.example/auth/callback#access_token=access"))).toEqual({
      kind: "missing",
    });
    expect(
      parseAuthCallback(new URL("https://baby.example/auth/callback#error=access_denied")),
    ).toEqual({ kind: "error" });
  });

  it("stores an implicit session in the cookie-backed client", async () => {
    const client = makeClient();

    await expect(
      completeAuthCallback(
        { kind: "implicit", accessToken: "access", refreshToken: "refresh" },
        client,
      ),
    ).resolves.toBe(true);
    expect(client.auth.setSession).toHaveBeenCalledWith({
      access_token: "access",
      refresh_token: "refresh",
    });
    expect(client.auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("reports a failed exchange instead of signing in", async () => {
    const client = makeClient();
    client.auth.exchangeCodeForSession.mockResolvedValue({ error: new Error("expired") });

    await expect(
      completeAuthCallback({ kind: "pkce", code: "expired-code" }, client),
    ).resolves.toBe(false);
  });

  it("reports a network failure instead of leaving the callback loading", async () => {
    const client = makeClient();
    client.auth.setSession.mockRejectedValue(new Error("network unavailable"));

    await expect(
      completeAuthCallback(
        { kind: "implicit", accessToken: "access", refreshToken: "refresh" },
        client,
      ),
    ).resolves.toBe(false);
  });
});

export type AuthCallbackInput =
  | { kind: "implicit"; accessToken: string; refreshToken: string }
  | { kind: "pkce"; code: string }
  | { kind: "error" }
  | { kind: "missing" };

interface AuthCallbackClient {
  auth: {
    setSession(tokens: {
      access_token: string;
      refresh_token: string;
    }): Promise<{ error: unknown }>;
    exchangeCodeForSession(code: string): Promise<{ error: unknown }>;
  };
}

export function parseAuthCallback(url: URL): AuthCallbackInput {
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));

  if (hash.has("error") || url.searchParams.has("error")) {
    return { kind: "error" };
  }

  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (accessToken && refreshToken) {
    return { kind: "implicit", accessToken, refreshToken };
  }

  const code = url.searchParams.get("code");
  if (code) {
    return { kind: "pkce", code };
  }

  return { kind: "missing" };
}

export async function completeAuthCallback(
  input: AuthCallbackInput,
  client: AuthCallbackClient,
) {
  try {
    if (input.kind === "implicit") {
      const { error } = await client.auth.setSession({
        access_token: input.accessToken,
        refresh_token: input.refreshToken,
      });
      return !error;
    }

    if (input.kind === "pkce") {
      const { error } = await client.auth.exchangeCodeForSession(input.code);
      return !error;
    }

    return false;
  } catch {
    return false;
  }
}

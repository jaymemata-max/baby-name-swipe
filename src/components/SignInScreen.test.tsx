import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SignInScreen } from "@/components/SignInScreen";

const { signInWithOtp } = vi.hoisted(() => ({
  signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseMagicLinkClient: () => ({ auth: { signInWithOtp } }),
}));

describe("SignInScreen", () => {
  it("starts a browser-independent magic-link flow", async () => {
    const user = userEvent.setup();
    render(<SignInScreen onSignedIn={vi.fn()} />);

    await user.type(screen.getByLabelText("Your Email Address"), "merel@example.com");
    await user.click(screen.getByRole("button", { name: "Send Magic Link" }));

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "merel@example.com",
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    expect(await screen.findByRole("heading", { name: "Check your email" })).toBeInTheDocument();
  });
});

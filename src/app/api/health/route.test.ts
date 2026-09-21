import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({ rpc })),
}));

import { GET } from "./route";

describe("GET /api/health", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("uses the narrow catalogue RPC and reports a healthy database", async () => {
    rpc.mockResolvedValue({ data: 290, error: null });

    const response = await GET();

    expect(rpc).toHaveBeenCalledWith("catalogue_size");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "ok",
      names_in_catalogue: 290,
    });
  });
});

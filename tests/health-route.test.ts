import { beforeEach, describe, expect, it, vi } from "vitest";

const { query } = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock("@/lib/db", () => ({ prisma: { $queryRaw: query } }));

import { dynamic, GET } from "@/app/api/health/route";

describe("database health route", () => {
  beforeEach(() => query.mockReset());

  it("requires runtime execution instead of prerendering database responses", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("reports a successful database connection", async () => {
    query.mockResolvedValueOnce([{ result: 1 }]);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "ok", database: "connected" });
  });

  it("keeps database exception details out of the response", async () => {
    query.mockRejectedValueOnce(new Error("SYNTHETIC_PRIVATE_DATABASE_DETAILS"));
    const response = await GET();
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body).toMatchObject({
      status: "error",
      database: "disconnected",
      error: "Database health check failed",
    });
    expect(JSON.stringify(body)).not.toContain("SYNTHETIC_PRIVATE_DATABASE_DETAILS");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Category } from "@/lib/prendas/types";

const catalog: Record<string, Category> = {
  shirt: "SHIRT",
  pants: "PANTS",
  shoes: "SHOES",
  socks: "SOCKS",
  ring: "ACCESSORI",
};

const setGarmentsDirtyState = vi.fn(async (ids: string[]) => ({ count: ids.length }));

// The repository is the only module that touches Prisma; mocking it keeps
// this a unit test of the service's washable filter.
vi.mock("@/lib/prendas/repository", () => ({
  findAllGarments: vi.fn(),
  findGarmentById: vi.fn(),
  findGarmentByIdSuffix: vi.fn(),
  createGarment: vi.fn(),
  updateGarment: vi.fn(),
  deleteGarment: vi.fn(),
  setGarmentImage: vi.fn(),
  findGarmentCategories: vi.fn(async (ids: string[]) =>
    ids.filter((id) => id in catalog).map((id) => ({ id, category: catalog[id] })),
  ),
  setGarmentsDirtyState,
}));

const { markGarmentsDirty, markGarmentsClean } = await import("@/lib/prendas/service");

beforeEach(() => {
  setGarmentsDirtyState.mockClear();
});

describe("markGarmentsDirty", () => {
  it("writes nothing when every id is a non-washable category", async () => {
    const affected = await markGarmentsDirty(["shoes", "socks", "ring"]);
    expect(affected).toBe(0);
    expect(setGarmentsDirtyState).not.toHaveBeenCalled();
  });

  it("writes nothing for an empty list", async () => {
    expect(await markGarmentsDirty([])).toBe(0);
    expect(setGarmentsDirtyState).not.toHaveBeenCalled();
  });

  it("drops non-washable ids and keeps the rest", async () => {
    const affected = await markGarmentsDirty(["shirt", "shoes", "pants"]);
    expect(setGarmentsDirtyState).toHaveBeenCalledWith(["shirt", "pants"], true);
    expect(affected).toBe(2);
  });
});

describe("markGarmentsClean", () => {
  it("applies the same washable filter", async () => {
    const affected = await markGarmentsClean(["shirt", "ring"]);
    expect(setGarmentsDirtyState).toHaveBeenCalledWith(["shirt"], false);
    expect(affected).toBe(1);
  });
});

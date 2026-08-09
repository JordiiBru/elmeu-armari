import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GarmentWithColors } from "@/lib/prendas/types";

// Real hexes lifted straight from sanzo-colors.json so the engine's actual
// perceptual matching resolves a real shared palette instead of a fixture
// invented for the test. Brown + Ochraceous Salmon share exactly
// combination 121; Hermosa Pink shares nothing with Brown.
const BROWN = "#6c2b11";
const OCHRACEOUS_SALMON = "#d99e73";
const LINCOLN_GREEN = "#405416"; // also combination 121 — used as a shoe

function garment(
  id: string,
  category: GarmentWithColors["category"],
  hex: string | null,
): GarmentWithColors {
  return {
    id,
    category,
    texture: null,
    pattern: null,
    size: null,
    subtype: null,
    length: null,
    fit: null,
    notes: null,
    image: null,
    dirtySince: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    colors: hex ? [{ id: `${id}-c`, hex }] : [],
    seasons: [{ id: `${id}-s`, season: "ALL_YEAR" }],
  };
}

const findOutfitByExactGarments = vi.fn(async (): Promise<{ id: string } | null> => null);
const createImprovisedOutfit = vi.fn(async (data: { garmentIds: string[]; paletteId: number | null }) => ({
  id: "new-outfit",
  ...data,
}));
const setWornDay = vi.fn(async () => ({}));
const findGarmentById = vi.fn(async (id: string) => garments.get(id) ?? null);

let garments: Map<string, GarmentWithColors>;

vi.mock("@/lib/outfits/repository", () => ({
  createOutfit: vi.fn(),
  findAllOutfits: vi.fn(),
  findOutfitByGarmentsAndPalette: vi.fn(),
  findOutfitByExactGarments,
  createImprovisedOutfit,
  findLastWornByGarment: vi.fn(),
  findOutfitById: vi.fn(),
  deleteOutfit: vi.fn(),
  countOutfits: vi.fn(),
  createOutfitExtras: vi.fn(),
  removeOutfitExtra: vi.fn(),
  removeOutfitExtrasByCategory: vi.fn(),
  setOutfitFavorite: vi.fn(),
  setWornDay,
  clearWornDay: vi.fn(),
  findWornEventsInRange: vi.fn(),
  findWornEventForDay: vi.fn(),
  findUnsettledPastWornEvents: vi.fn(),
  markWornEventSettled: vi.fn(),
}));

vi.mock("@/lib/prendas/service", () => ({
  findGarmentById,
  markGarmentsDirty: vi.fn(),
}));

const { wearImprovisedOutfit } = await import("@/lib/outfits/service");

beforeEach(() => {
  findOutfitByExactGarments.mockClear();
  createImprovisedOutfit.mockClear();
  setWornDay.mockClear();
  findOutfitByExactGarments.mockResolvedValue(null);
});

describe("wearImprovisedOutfit", () => {
  it("resolves the shared Sanzo palette when the garments have one", async () => {
    garments = new Map([
      ["shirt", garment("shirt", "SHIRT", BROWN)],
      ["pants", garment("pants", "PANTS", OCHRACEOUS_SALMON)],
    ]);
    await wearImprovisedOutfit(["shirt", "pants"]);
    expect(createImprovisedOutfit).toHaveBeenCalledWith({
      garmentIds: ["shirt", "pants"],
      paletteId: 121,
    });
  });

  it("stores null when only one garment has a matchable colour (needs 2 to anchor a palette)", async () => {
    garments = new Map([
      ["shirt", garment("shirt", "SHIRT", BROWN)],
      // ACCESSORI-style piece with no recorded colour at all.
      ["pants", garment("pants", "PANTS", null)],
    ]);
    await wearImprovisedOutfit(["shirt", "pants"]);
    expect(createImprovisedOutfit).toHaveBeenCalledWith({
      garmentIds: ["shirt", "pants"],
      paletteId: null,
    });
  });

  it("assigns the resulting outfit to today", async () => {
    garments = new Map([
      ["shirt", garment("shirt", "SHIRT", BROWN)],
      ["pants", garment("pants", "PANTS", OCHRACEOUS_SALMON)],
    ]);
    const outfitId = await wearImprovisedOutfit(["shirt", "pants"]);
    expect(outfitId).toBe("new-outfit");
    expect(setWornDay).toHaveBeenCalledTimes(1);
    expect(setWornDay).toHaveBeenCalledWith("new-outfit", expect.any(Date));
  });

  it("reuses the existing outfit when the exact garment set already exists, without creating a duplicate", async () => {
    findOutfitByExactGarments.mockResolvedValueOnce({ id: "existing-outfit" });
    garments = new Map([
      ["shirt", garment("shirt", "SHIRT", BROWN)],
      ["shoes", garment("shoes", "SHOES", LINCOLN_GREEN)],
    ]);
    const outfitId = await wearImprovisedOutfit(["shirt", "shoes"]);
    expect(outfitId).toBe("existing-outfit");
    expect(createImprovisedOutfit).not.toHaveBeenCalled();
    expect(setWornDay).toHaveBeenCalledWith("existing-outfit", expect.any(Date));
  });

  it("resolves the palette from primary garments only, ignoring shoes", async () => {
    // Shoes are excluded from colour matching (EXCLUDED_CATEGORIES in
    // engine.ts): Lincoln Green also belongs to combination 121, but the
    // resolved palette must come from shirt+pants alone.
    garments = new Map([
      ["shirt", garment("shirt", "SHIRT", BROWN)],
      ["pants", garment("pants", "PANTS", OCHRACEOUS_SALMON)],
      ["shoes", garment("shoes", "SHOES", LINCOLN_GREEN)],
    ]);
    await wearImprovisedOutfit(["shirt", "pants", "shoes"]);
    expect(createImprovisedOutfit).toHaveBeenCalledWith({
      garmentIds: ["shirt", "pants", "shoes"],
      paletteId: 121,
    });
  });
});

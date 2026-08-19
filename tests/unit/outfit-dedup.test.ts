import { describe, it, expect, vi, beforeEach } from "vitest";

const findOutfitByGarmentsAndPalette = vi.fn();
const createOutfit = vi.fn(async (data: unknown) => ({ id: "new-outfit", ...(data as object) }));
const countOutfits = vi.fn(async () => 0);

vi.mock("@/lib/outfits/repository", () => ({
  createOutfit,
  findAllOutfits: vi.fn(),
  findOutfitByGarmentsAndPalette,
  findOutfitById: vi.fn(),
  deleteOutfit: vi.fn(),
  countOutfits,
  setOutfitFavorite: vi.fn(),
  setWornDay: vi.fn(),
  clearWornDay: vi.fn(),
  findWornEventsInRange: vi.fn(),
  findWornEventForDay: vi.fn(),
  findUnsettledPastWornEvents: vi.fn(),
  markWornEventSettled: vi.fn(),
}));

vi.mock("@/lib/prendas/service", () => ({
  findGarmentById: vi.fn(),
  markGarmentsDirty: vi.fn(),
}));

const { saveOutfit } = await import("@/lib/outfits/service");

beforeEach(() => {
  findOutfitByGarmentsAndPalette.mockClear();
  createOutfit.mockClear();
  countOutfits.mockClear();
});

describe("saveOutfit dedup", () => {
  it("returns the existing outfit for the same palette and the same clothes, without creating a second one", async () => {
    const existing = { id: "existing-outfit", paletteId: 1, garments: [] };
    findOutfitByGarmentsAndPalette.mockResolvedValue(existing);

    const result = await saveOutfit({ paletteId: 1, garmentIds: ["shirt", "pants"] });

    expect(result).toBe(existing);
    expect(findOutfitByGarmentsAndPalette).toHaveBeenCalledWith(
      ["shirt", "pants"],
      1,
    );
    expect(createOutfit).not.toHaveBeenCalled();
  });

  it("creates a new outfit when no match exists for that palette and clothes set", async () => {
    findOutfitByGarmentsAndPalette.mockResolvedValue(null);

    const result = await saveOutfit({ paletteId: 1, garmentIds: ["shirt", "pants"] });

    expect(createOutfit).toHaveBeenCalledWith({
      paletteId: 1,
      garmentIds: ["shirt", "pants"],
      name: "Outfit #1",
    });
    expect((result as { id: string }).id).toBe("new-outfit");
  });

  it("rejects an unknown paletteId before touching the repository", async () => {
    await expect(
      saveOutfit({ paletteId: 999999, garmentIds: ["shirt"] }),
    ).rejects.toThrow();
    expect(findOutfitByGarmentsAndPalette).not.toHaveBeenCalled();
    expect(createOutfit).not.toHaveBeenCalled();
  });
});

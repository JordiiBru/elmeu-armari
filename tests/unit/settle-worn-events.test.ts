import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Category } from "@/lib/prendas/types";

function garment(id: string, category: Category) {
  return { id, category };
}

const events = [
  {
    id: "w1",
    outfitId: "o1",
    date: new Date("2026-08-01T00:00:00.000Z"),
    settledAt: null,
    outfit: {
      garments: [
        { role: "primary", garment: garment("shirt", "SHIRT") },
        { role: "primary", garment: garment("pants", "PANTS") },
        { role: "extra", garment: garment("shoes", "SHOES") },
      ],
    },
  },
  {
    id: "w2",
    outfitId: "o2",
    date: new Date("2026-08-02T00:00:00.000Z"),
    settledAt: null,
    outfit: {
      garments: [
        { role: "extra", garment: garment("shoes2", "SHOES") },
        { role: "extra", garment: garment("ring", "ACCESSORI") },
      ],
    },
  },
];

const findUnsettledPastWornEvents = vi.fn(async () => events);
const markWornEventSettled = vi.fn(async (id: string) => ({ id }));
const markGarmentsDirty = vi.fn(async (ids: string[]) => ids.length);

vi.mock("@/lib/outfits/repository", () => ({
  createOutfit: vi.fn(),
  findAllOutfits: vi.fn(),
  findOutfitByGarmentsAndPalette: vi.fn(),
  findOutfitById: vi.fn(),
  deleteOutfit: vi.fn(),
  countOutfits: vi.fn(),
  createOutfitExtras: vi.fn(),
  removeOutfitExtra: vi.fn(),
  removeOutfitExtrasByCategory: vi.fn(),
  setOutfitFavorite: vi.fn(),
  setWornDay: vi.fn(),
  clearWornDay: vi.fn(),
  findWornEventsInRange: vi.fn(),
  findWornEventForDay: vi.fn(),
  findUnsettledPastWornEvents,
  markWornEventSettled,
}));

vi.mock("@/lib/prendas/service", () => ({
  findGarmentById: vi.fn(),
  markGarmentsDirty,
}));

const { settlePastWornEvents } = await import("@/lib/outfits/service");

beforeEach(() => {
  findUnsettledPastWornEvents.mockClear();
  markWornEventSettled.mockClear();
  markGarmentsDirty.mockClear();
});

describe("settlePastWornEvents", () => {
  it("dirties only the washable pieces of each unsettled past outfit", async () => {
    const count = await settlePastWornEvents();
    expect(count).toBe(2);
    expect(markGarmentsDirty).toHaveBeenCalledTimes(1);
    expect(markGarmentsDirty).toHaveBeenCalledWith(["shirt", "pants"]);
  });

  it("skips the dirty call for an outfit with no washable pieces, but still settles it", async () => {
    await settlePastWornEvents();
    expect(markGarmentsDirty).not.toHaveBeenCalledWith([]);
    expect(markWornEventSettled).toHaveBeenCalledWith("w2");
  });

  it("marks every returned event as settled", async () => {
    await settlePastWornEvents();
    expect(markWornEventSettled).toHaveBeenCalledWith("w1");
    expect(markWornEventSettled).toHaveBeenCalledTimes(2);
  });

  it("does nothing when there is nothing to settle", async () => {
    findUnsettledPastWornEvents.mockResolvedValueOnce([]);
    const count = await settlePastWornEvents();
    expect(count).toBe(0);
    expect(markGarmentsDirty).not.toHaveBeenCalled();
    expect(markWornEventSettled).not.toHaveBeenCalled();
  });
});

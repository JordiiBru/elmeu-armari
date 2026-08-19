import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Category, GarmentWithColors, Season } from "@/lib/prendas/types";
import type { WornDay } from "@/lib/outfits/types";

function garment(
  id: string,
  category: Category,
  opts: { dirty?: boolean; seasons?: Season[] } = {},
): GarmentWithColors {
  return {
    id,
    category,
    texture: "COTTON",
    pattern: "PLAIN",
    fit: null,
    subtype: null,
    size: null,
    length: null,
    notes: null,
    image: null,
    dirtySince: opts.dirty ? new Date("2026-08-01T09:00:00Z") : null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    colors: [{ id: `color-${id}`, hex: "#112233" }],
    seasons: (opts.seasons ?? ["ALL_YEAR"]).map((season, i) => ({
      id: `season-${id}-${i}`,
      season,
    })),
  };
}

// Shape returned by the repository's `outfitInclude()` — a raw Prisma
// outfit with its garment join rows, the same shape `toSavedOutfit`
// consumes in service.ts.
function outfitRow(
  id: string,
  clothes: GarmentWithColors[],
  wornEvents: { id: string; date: Date; garments: GarmentWithColors[] }[] = [],
) {
  return {
    id,
    name: id,
    paletteId: 1,
    favorite: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    garments: clothes.map((g) => ({ garment: g })),
    wornEvents: wornEvents.map((w) => ({
      id: w.id,
      date: w.date,
      garments: w.garments.map((g) => ({ garment: g })),
    })),
  };
}

const findOutfitById = vi.fn();
const setWornDay = vi.fn(async () => ({ id: "we1" }));

vi.mock("@/lib/outfits/repository", () => ({
  createOutfit: vi.fn(),
  findAllOutfits: vi.fn(),
  findOutfitByGarmentsAndPalette: vi.fn(),
  findOutfitById,
  deleteOutfit: vi.fn(),
  countOutfits: vi.fn(),
  setOutfitFavorite: vi.fn(),
  setWornDay,
  clearWornDay: vi.fn(),
  findWornEventsInRange: vi.fn(),
  findWornEventForDay: vi.fn(),
  findUnsettledPastWornEvents: vi.fn(),
  markWornEventSettled: vi.fn(),
}));

const garmentCatalog: Record<string, GarmentWithColors> = {
  shoes1: garment("shoes1", "SHOES"),
  shoes2: garment("shoes2", "SHOES"),
  socks: garment("socks", "SOCKS"),
  ring: garment("ring", "ACCESSORI"),
  pants: garment("pants", "PANTS"), // not an extra category
};

const findGarmentCategories = vi.fn(async (ids: string[]) =>
  ids
    .map((id) => garmentCatalog[id])
    .filter((g): g is GarmentWithColors => g !== undefined)
    .map((g) => ({ id: g.id, category: g.category })),
);
const markGarmentsDirty = vi.fn();

vi.mock("@/lib/prendas/service", () => ({
  findGarmentCategories,
  markGarmentsDirty,
}));

const { wearOutfit } = await import("@/lib/outfits/service");
const { lastWornExtras } = await import("@/lib/outfits/worn");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-15T12:00:00Z"));
  findOutfitById.mockReset();
  setWornDay.mockClear();
  findGarmentCategories.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("wearOutfit", () => {
  it("drops ids that are not an extra category", async () => {
    findOutfitById.mockResolvedValue(outfitRow("o1", [garment("sh", "SHIRT")]));

    await wearOutfit("o1", new Date("2026-08-20T00:00:00Z"), ["pants", "socks"]);

    expect(setWornDay).toHaveBeenCalledWith(
      "o1",
      // Truncated to midnight UTC: the unique constraint on WornEvent.date
      // is what enforces one outfit per day, so the time must never survive.
      new Date("2026-08-20T00:00:00Z"),
      ["socks"],
    );
  });

  it("collapses two pairs of shoes to the first", async () => {
    findOutfitById.mockResolvedValue(outfitRow("o1", [garment("sh", "SHIRT")]));

    await wearOutfit("o1", new Date("2026-08-20T00:00:00Z"), ["shoes1", "shoes2"]);

    expect(setWornDay).toHaveBeenCalledWith(
      "o1",
      expect.any(Date),
      ["shoes1"],
    );
  });

  it("throws when worn today with a dirty piece", async () => {
    findOutfitById.mockResolvedValue(
      outfitRow("o1", [garment("sh", "SHIRT", { dirty: true })]),
    );

    await expect(
      wearOutfit("o1", new Date("2026-08-15T00:00:00Z"), []),
    ).rejects.toThrow();
    expect(setWornDay).not.toHaveBeenCalled();
  });

  it("throws when planned for a past day with a dirty piece", async () => {
    findOutfitById.mockResolvedValue(
      outfitRow("o1", [garment("sh", "SHIRT", { dirty: true })]),
    );

    await expect(
      wearOutfit("o1", new Date("2026-08-10T00:00:00Z"), []),
    ).rejects.toThrow();
    expect(setWornDay).not.toHaveBeenCalled();
  });

  it("wears today when every piece is clean", async () => {
    findOutfitById.mockResolvedValue(outfitRow("o1", [garment("sh", "SHIRT")]));

    await wearOutfit("o1", new Date("2026-08-15T18:30:00Z"), ["shoes1"]);

    expect(setWornDay).toHaveBeenCalledWith(
      "o1",
      new Date("2026-08-15T00:00:00Z"),
      ["shoes1"],
    );
  });

  it("allows a future day even with a dirty piece", async () => {
    findOutfitById.mockResolvedValue(
      outfitRow("o1", [garment("sh", "SHIRT", { dirty: true })]),
    );

    await wearOutfit("o1", new Date("2026-08-20T00:00:00Z"), []);

    expect(setWornDay).toHaveBeenCalledWith("o1", expect.any(Date), []);
  });

  it("throws for an unknown outfit id", async () => {
    findOutfitById.mockResolvedValue(null);

    await expect(
      wearOutfit("ghost", new Date("2026-08-20T00:00:00Z"), []),
    ).rejects.toThrow();
    expect(setWornDay).not.toHaveBeenCalled();
  });
});

describe("lastWornExtras", () => {
  it("returns the most recent day's extras", () => {
    const events: WornDay[] = [
      { id: "w2", date: new Date("2026-08-10T00:00:00Z"), extras: [garment("shoes1", "SHOES")] },
      { id: "w1", date: new Date("2026-08-01T00:00:00Z"), extras: [garment("shoes2", "SHOES")] },
    ];
    const outfit = {
      id: "o1",
      name: "o1",
      paletteId: 1,
      favorite: false,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      garments: [],
      wornEvents: events,
    };
    expect(lastWornExtras(outfit).map((g) => g.id)).toEqual(["shoes1"]);
  });

  it("returns an empty array for a never-worn outfit", () => {
    const outfit = {
      id: "o1",
      name: "o1",
      paletteId: 1,
      favorite: false,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      garments: [],
      wornEvents: [],
    };
    expect(lastWornExtras(outfit)).toEqual([]);
  });
});

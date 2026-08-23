import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * A day's photo is a file on disk that only its row points at, and both
 * ways of destroying that row go through the service. If either stops
 * cleaning up, nothing breaks visibly — the uploads directory just grows
 * files nobody can ever see again.
 */
const clearWornDay = vi.fn();
const deleteOutfitRow = vi.fn(async (id: string) => ({ id }));
const findWornEventImages = vi.fn();

vi.mock("@/lib/outfits/repository", () => ({
  createOutfit: vi.fn(),
  findAllOutfits: vi.fn(),
  findOutfitByGarmentsAndPalette: vi.fn(),
  findOutfitById: vi.fn(),
  deleteOutfit: deleteOutfitRow,
  countOutfits: vi.fn(),
  setWornDay: vi.fn(),
  clearWornDay,
  findWornEventsInRange: vi.fn(),
  findWornEventForDay: vi.fn(),
  findWornEventById: vi.fn(),
  findWornEventImages,
  setWornEventImage: vi.fn(),
  findUnsettledPastWornEvents: vi.fn(),
  markWornEventSettled: vi.fn(),
}));

vi.mock("@/lib/prendas/service", () => ({
  findGarmentCategories: vi.fn(),
  markGarmentsDirty: vi.fn(),
}));

const deleteUploadImage = vi.fn();
vi.mock("@/lib/uploads", () => ({ deleteUploadImage }));

const { unassignDay, deleteOutfit } = await import("@/lib/outfits/service");

beforeEach(() => {
  clearWornDay.mockClear();
  deleteOutfitRow.mockClear();
  findWornEventImages.mockReset();
  deleteUploadImage.mockClear();
});

describe("day photo cleanup", () => {
  it("deletes the photo of a day that is emptied", async () => {
    findWornEventImages.mockResolvedValue([{ id: "we1", image: "we1.webp" }]);

    await unassignDay(new Date("2026-08-20T09:30:00Z"));

    // Truncated to midnight: the day key, never the click's instant.
    expect(findWornEventImages).toHaveBeenCalledWith({
      date: new Date("2026-08-20T00:00:00Z"),
    });
    expect(clearWornDay).toHaveBeenCalledWith(new Date("2026-08-20T00:00:00Z"));
    expect(deleteUploadImage).toHaveBeenCalledWith("we1");
  });

  it("touches no file when the day has no photo", async () => {
    findWornEventImages.mockResolvedValue([]);

    await unassignDay(new Date("2026-08-20T00:00:00Z"));

    expect(clearWornDay).toHaveBeenCalled();
    expect(deleteUploadImage).not.toHaveBeenCalled();
  });

  it("deletes the photos of every day an outfit is deleted from", async () => {
    findWornEventImages.mockResolvedValue([
      { id: "we1", image: "we1.webp" },
      { id: "we2", image: "we2.webp" },
    ]);

    await deleteOutfit("o1");

    expect(findWornEventImages).toHaveBeenCalledWith({ outfitId: "o1" });
    expect(deleteOutfitRow).toHaveBeenCalledWith("o1");
    expect(deleteUploadImage).toHaveBeenCalledWith("we1");
    expect(deleteUploadImage).toHaveBeenCalledWith("we2");
  });
});

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { rmSync } from "node:fs";
import Database from "better-sqlite3";
import type { GarmentInput } from "@/lib/prendas/types";
import { createMigratedDatabase } from "./support/migrated-db";

/**
 * Two accounts, one real SQLite file built from the real migrations. What
 * this proves is the property the mocked tests cannot: that whatever id
 * account B sends, it never reads, changes or deletes a row of account A.
 * The wardrobe used to be one shared pool, and nothing here would have
 * noticed.
 */

const { dir, file } = createMigratedDatabase("armari-isolation");
process.env.DATABASE_URL = `file:${file}`;

const A = "user-a";
const B = "user-b";

function input(overrides: Partial<GarmentInput> = {}): GarmentInput {
  return {
    category: "SHIRT",
    texture: "COTTON",
    pattern: "PLAIN",
    fit: "REGULAR",
    subtype: "TEE",
    length: null,
    size: "M",
    seasons: ["ALL_YEAR"],
    hexColors: ["#112233"],
    ...overrides,
  };
}

const prendas = await import("@/lib/prendas/service");
const outfits = await import("@/lib/outfits/service");
const { ownsPhoto } = await import("@/lib/photo-access");
const { palettes } = await import("@/lib/colors");
const paletteId = palettes[0].id;

let shirtA: string;
let pantsA: string;
let shirtB: string;
let outfitA: string;
let dayA: string;

beforeAll(async () => {
  const db = new Database(file);
  const insert = db.prepare(
    "INSERT INTO User (id, username, passwordHash, mustChangePw, createdAt) VALUES (?, ?, 'x', 0, ?)",
  );
  insert.run(A, "a", new Date().toISOString());
  insert.run(B, "b", new Date().toISOString());
  db.close();

  shirtA = (await prendas.addGarment(A, input())).id;
  pantsA = (await prendas.addGarment(A, input({ category: "PANTS", subtype: "CHINO", length: "LONG", size: "32", fit: "STRAIGHT" }))).id;
  shirtB = (await prendas.addGarment(B, input())).id;

  outfitA = (await outfits.saveOutfit(A, { paletteId, garmentIds: [shirtA, pantsA] })).id;
  await outfits.wearOutfit(A, outfitA, new Date("2026-09-21T00:00:00Z"), []);
  dayA = (await outfits.findWeekPlan(A, new Date("2026-09-21T00:00:00Z"))).find((d) => d.event)!.event!.id;
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("garments", () => {
  it("lists only the account's own", async () => {
    expect((await prendas.findAllGarments(A)).map((g) => g.id).sort()).toEqual([shirtA, pantsA].sort());
    expect((await prendas.findAllGarments(B)).map((g) => g.id)).toEqual([shirtB]);
  });

  it("does not resolve another account's garment by id or by slug suffix", async () => {
    expect(await prendas.findGarmentById(B, shirtA)).toBeNull();
    expect(await prendas.findGarmentByIdSuffix(B, shirtA.slice(-6))).toBeNull();
    expect(await prendas.findGarmentById(A, shirtA)).not.toBeNull();
  });

  it("refuses to edit or delete another account's garment, and leaves it intact", async () => {
    await expect(prendas.editGarment(B, shirtA, input({ notes: "hijacked" }))).rejects.toThrow();
    await expect(prendas.deleteGarment(B, shirtA)).rejects.toThrow();
    const still = await prendas.findGarmentById(A, shirtA);
    expect(still?.notes).toBeNull();
  });

  it("does not let another account dirty, clean or re-photograph a garment", async () => {
    expect(await prendas.markGarmentsDirty(B, [shirtA])).toBe(0);
    await prendas.setGarmentImage(B, shirtA, "stolen.webp");
    const still = await prendas.findGarmentById(A, shirtA);
    expect(still?.dirtySince).toBeNull();
    expect(still?.image).toBeNull();
  });
});

describe("outfits and days", () => {
  it("does not build an outfit out of another account's clothes", async () => {
    await expect(
      outfits.saveOutfit(B, { paletteId, garmentIds: [shirtA, pantsA] }),
    ).rejects.toThrow(/outside this wardrobe/);
    expect(await outfits.findAllOutfits(B)).toEqual([]);
  });

  it("keeps saved outfits, favourites and deletion inside the account", async () => {
    expect((await outfits.findAllOutfits(A)).map((o) => o.id)).toEqual([outfitA]);
    expect(await outfits.findAllOutfits(B)).toEqual([]);

    await outfits.setOutfitFavorite(B, outfitA, false);
    expect((await outfits.findAllOutfits(A))[0].favorite).toBe(true);

    await expect(outfits.deleteOutfit(B, outfitA)).rejects.toThrow();
    expect(await outfits.findAllOutfits(A)).toHaveLength(1);
  });

  it("does not let another account wear, see or empty a day of the first", async () => {
    await expect(
      outfits.wearOutfit(B, outfitA, new Date("2026-09-22T00:00:00Z"), []),
    ).rejects.toThrow(/not found/i);

    const week = await outfits.findWeekPlan(B, new Date("2026-09-21T00:00:00Z"));
    expect(week.every((d) => d.outfit === null)).toBe(true);

    await outfits.unassignDay(B, new Date("2026-09-21T00:00:00Z"));
    const stillThere = await outfits.findWeekPlan(A, new Date("2026-09-21T00:00:00Z"));
    expect(stillThere.some((d) => d.outfit?.id === outfitA)).toBe(true);
  });

  it("gives each account its own calendar: the same date is free for both", async () => {
    const outfitB = (await outfits.saveOutfit(B, { paletteId, garmentIds: [shirtB] })).id;
    await outfits.wearOutfit(B, outfitB, new Date("2026-09-21T00:00:00Z"), []);
    const weekA = await outfits.findWeekPlan(A, new Date("2026-09-21T00:00:00Z"));
    const weekB = await outfits.findWeekPlan(B, new Date("2026-09-21T00:00:00Z"));
    expect(weekA.find((d) => d.outfit)?.outfit?.id).toBe(outfitA);
    expect(weekB.find((d) => d.outfit)?.outfit?.id).toBe(outfitB);
  });

  it("does not let another account attach a photo to a day that is not its own", async () => {
    await outfits.setDayPhoto(B, dayA, "stolen.webp");
    expect(await outfits.findDayById(B, dayA)).toBeNull();
    expect((await outfits.findDayById(A, dayA))?.image).toBeNull();
  });
});

describe("photos", () => {
  it("serves a photo only to the account whose garment or day it belongs to", async () => {
    expect(await ownsPhoto(A, `${shirtA}.webp`)).toBe(true);
    expect(await ownsPhoto(A, `${shirtA}-thumb.webp`)).toBe(true);
    expect(await ownsPhoto(A, `${dayA}.webp`)).toBe(true);

    expect(await ownsPhoto(B, `${shirtA}.webp`)).toBe(false);
    expect(await ownsPhoto(B, `${shirtA}-thumb.webp`)).toBe(false);
    expect(await ownsPhoto(B, `${dayA}.webp`)).toBe(false);
  });

  it("refuses a filename that is not a photo name", async () => {
    expect(await ownsPhoto(A, "../etc/passwd")).toBe(false);
    expect(await ownsPhoto(A, "nope.webp")).toBe(false);
  });
});

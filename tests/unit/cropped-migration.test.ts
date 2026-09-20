import { describe, it, expect, afterAll } from "vitest";
import { readFileSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { upgradeLegacyCropped } from "@/lib/prendas/import";
import { createMigratedDatabase } from "./support/migrated-db";

const { dir, file, migrationsDir } = createMigratedDatabase("armari-cropped", {
  stopBefore: "garment_cropped",
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("the migration that makes cropped a flag", () => {
  it("keeps every row, moves CROPPED out of the fit and leaves the other fits alone", () => {
    const db = new Database(file);
    db.prepare("INSERT INTO User (id, username, passwordHash, mustChangePw, createdAt) VALUES ('u','u','x',0,?)").run(new Date().toISOString());
    const insert = db.prepare("INSERT INTO Garment (id, userId, category, fit, updatedAt) VALUES (?, 'u', ?, ?, ?)");
    const now = new Date().toISOString();
    insert.run("tee-cropped", "SHIRT", "CROPPED", now);
    insert.run("sweater-cropped", "SWEATER", "CROPPED", now);
    insert.run("tee-oversized", "SHIRT", "OVERSIZED", now);
    insert.run("chino", "PANTS", "STRAIGHT", now);
    insert.run("no-fit", "SHIRT", null, now);
    db.prepare("INSERT INTO Color (id, hex, garmentId) VALUES ('c1', '#112233', 'tee-cropped')").run();

    const entry = readdirSync(migrationsDir).find((n) => n.endsWith("garment_cropped"))!;
    db.exec(readFileSync(path.join(migrationsDir, entry, "migration.sql"), "utf8"));

    const rows = Object.fromEntries(
      (db.prepare("SELECT id, fit, cropped FROM Garment").all() as { id: string; fit: string | null; cropped: number }[]).map(
        (r) => [r.id, r],
      ),
    );
    expect(rows["tee-cropped"]).toMatchObject({ fit: null, cropped: 1 });
    expect(rows["sweater-cropped"]).toMatchObject({ fit: null, cropped: 1 });
    expect(rows["tee-oversized"]).toMatchObject({ fit: "OVERSIZED", cropped: 0 });
    expect(rows["chino"]).toMatchObject({ fit: "STRAIGHT", cropped: 0 });
    expect(rows["no-fit"]).toMatchObject({ fit: null, cropped: 0 });
    expect(db.prepare("SELECT COUNT(*) n FROM Garment").get()).toEqual({ n: 5 });
    // The children were not touched: this is an ADD COLUMN, not a rebuild.
    expect(db.prepare("SELECT COUNT(*) n FROM Color").get()).toEqual({ n: 1 });
    db.close();
  });
});

describe("an export made before cropped was a flag", () => {
  it("reads fit CROPPED as cropped with no fit, and touches nothing else", () => {
    const body = upgradeLegacyCropped({
      version: 3,
      garments: [
        { category: "SHIRT", fit: "CROPPED" },
        { category: "SHIRT", fit: "OVERSIZED" },
        { category: "PANTS", fit: null },
      ],
    }) as { garments: Record<string, unknown>[] };
    expect(body.garments[0]).toEqual({ category: "SHIRT", fit: null, cropped: true });
    expect(body.garments[1]).toEqual({ category: "SHIRT", fit: "OVERSIZED" });
    expect(body.garments[2]).toEqual({ category: "PANTS", fit: null });
  });

  it("passes anything that is not a wardrobe through untouched", () => {
    expect(upgradeLegacyCropped(null)).toBeNull();
    expect(upgradeLegacyCropped({ version: 3 })).toEqual({ version: 3 });
  });
});

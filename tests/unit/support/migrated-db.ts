import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";

/**
 * A throwaway SQLite file built from the real migrations, so a test can run
 * against the schema production has and not against a mock of it.
 */
export function createMigratedDatabase(prefix: string): { dir: string; file: string } {
  const dir = mkdtempSync(path.join(tmpdir(), `${prefix}-`));
  const file = path.join(dir, "test.db");
  const db = new Database(file);
  const migrations = path.resolve(__dirname, "../../../prisma/migrations");
  for (const entry of readdirSync(migrations, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    if (!entry.isDirectory()) continue;
    db.exec(readFileSync(path.join(migrations, entry.name, "migration.sql"), "utf8"));
  }
  db.close();
  return { dir, file };
}

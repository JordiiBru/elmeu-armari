import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { verifyPassword } from "@/lib/auth/password";
import { MAX_PASSWORD_LENGTH, MAX_USERNAME_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/auth/policy";
import { createMigratedDatabase } from "./support/migrated-db";

/**
 * `scripts/create-user.mjs` writes SQL by hand and repeats the Argon2
 * parameters and the username rule, because the production image ships
 * compiled JavaScript and not the Prisma client. This runs it against a real
 * database built from the migrations, so a column renamed or a cost
 * parameter changed in the app and forgotten here fails a test, not a login.
 */

const { dir, file } = createMigratedDatabase("armari-script");
const uploads = path.join(dir, "uploads");
const env = { ...process.env, DATABASE_URL: `file:${file}`, UPLOAD_DIR: uploads };
const script = path.resolve(__dirname, "../../scripts/create-user.mjs");

function run(...args: string[]) {
  return spawnSync("node", [script, ...args], { env, encoding: "utf8" });
}

function query<T>(sql: string, ...params: unknown[]): T[] {
  const db = new Database(file, { readonly: true });
  try {
    return db.prepare(sql).all(...params) as T[];
  } finally {
    db.close();
  }
}

beforeAll(() => {
  mkdirSync(uploads, { recursive: true });
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("create-user script", () => {
  it("creates an account whose password the app verifies, flagged temporary", async () => {
    const out = run("--username", "Ana");
    expect(out.status).toBe(0);
    const password = /Password: (\S+)/.exec(out.stdout)?.[1] ?? "";
    expect(password.length).toBeGreaterThanOrEqual(MIN_PASSWORD_LENGTH);

    const [user] = query<{ username: string; passwordHash: string; mustChangePw: number; recoveryHash: string | null }>(
      "SELECT username, passwordHash, mustChangePw, recoveryHash FROM User WHERE username = 'ana'",
    );
    expect(user.mustChangePw).toBe(1);
    expect(user.recoveryHash).toBeNull();
    // The hash written here is verified by the app's own parameters.
    expect(await verifyPassword(user.passwordHash, password)).toBe(true);
  });

  it("refuses a second account with the same name unless --reset", () => {
    expect(run("--username", "ana").status).toBe(1);
  });

  it("refuses names and passwords the app would refuse", () => {
    expect(run("--username", "x".repeat(MAX_USERNAME_LENGTH + 1)).status).toBe(1);
    expect(run("--username", "Bad Name").status).toBe(1);
    const tooLong = spawnSync("node", [script, "--username", "bob", "--stdin"], {
      env,
      input: "p".repeat(MAX_PASSWORD_LENGTH + 1),
      encoding: "utf8",
    });
    expect(tooLong.status).toBe(1);
  });

  it("a reset makes the password temporary again and forgets the recovery code", () => {
    const db = new Database(file);
    db.prepare("UPDATE User SET mustChangePw = 0, recoveryHash = 'hash' WHERE username = 'ana'").run();
    db.close();

    expect(run("--username", "ana", "--reset").status).toBe(0);
    const [user] = query<{ mustChangePw: number; recoveryHash: string | null }>(
      "SELECT mustChangePw, recoveryHash FROM User WHERE username = 'ana'",
    );
    expect(user.mustChangePw).toBe(1);
    expect(user.recoveryHash).toBeNull();
  });

  it("lists accounts without printing any hash", () => {
    const out = run("--list");
    expect(out.status).toBe(0);
    expect(out.stdout).toContain("ana");
    expect(out.stdout).not.toContain("$argon2");
  });

  it("deletes an account with its wardrobe and its photos, and only with --yes", () => {
    const db = new Database(file);
    const owner = query<{ id: string }>("SELECT id FROM User WHERE username = 'ana'")[0].id;
    db.prepare("INSERT INTO User (id, username, passwordHash, mustChangePw, createdAt) VALUES ('u2','keep','x',0,?)").run(new Date().toISOString());
    db.prepare("INSERT INTO Garment (id, userId, category, image, updatedAt) VALUES ('g1', ?, 'SHIRT', 'g1.webp', ?)").run(owner, new Date().toISOString());
    db.prepare("INSERT INTO Garment (id, userId, category, image, updatedAt) VALUES ('g2', 'u2', 'SHIRT', 'g2.webp', ?)").run(new Date().toISOString());
    db.prepare("INSERT INTO Color (id, hex, garmentId) VALUES ('c1', '#112233', 'g1')").run();
    db.close();
    for (const name of ["g1.webp", "g1-thumb.webp", "g2.webp"]) writeFileSync(path.join(uploads, name), "x");

    const refused = run("--username", "ana", "--delete");
    expect(refused.status).toBe(1);
    expect(query("SELECT id FROM User WHERE username = 'ana'")).toHaveLength(1);

    const done = run("--username", "ana", "--delete", "--yes");
    expect(done.status).toBe(0);
    expect(query("SELECT id FROM User WHERE username = 'ana'")).toHaveLength(0);
    // The cascade took the wardrobe, and only that account's.
    expect(query("SELECT id FROM Garment").map((g) => (g as { id: string }).id)).toEqual(["g2"]);
    expect(query("SELECT id FROM Color")).toHaveLength(0);
    expect(existsSync(path.join(uploads, "g1.webp"))).toBe(false);
    expect(existsSync(path.join(uploads, "g1-thumb.webp"))).toBe(false);
    expect(existsSync(path.join(uploads, "g2.webp"))).toBe(true);
  });

  it("is runnable as the container runs it", () => {
    expect(() => execFileSync("node", ["--check", script])).not.toThrow();
  });
});

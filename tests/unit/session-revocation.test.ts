import { describe, it, expect, beforeEach, afterEach } from "vitest";
import os from "os";
import path from "path";
import fs from "fs/promises";
import Database from "better-sqlite3";
import { authConfig } from "@/auth.config";
import {
  credentialsVersion,
  currentCredentials,
  isSessionCurrent,
} from "@/lib/auth/credentials-version";

let dir: string;
let dbPath: string;

function open() {
  return new Database(dbPath);
}

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "revocation-"));
  dbPath = path.join(dir, "test.db");
  process.env.DATABASE_URL = `file:${dbPath}`;
  const db = open();
  // The columns this module reads; the real table has more.
  db.exec(`CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "mustChangePw" BOOLEAN NOT NULL DEFAULT true
  )`);
  db.prepare('INSERT INTO "User" VALUES (?, ?, ?, ?)').run("u1", "jordi", "$argon2id$hash-A", 1);
  db.close();
});

afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

function changePassword(hash: string, mustChangePw = 0) {
  const db = open();
  db.prepare('UPDATE "User" SET passwordHash = ?, mustChangePw = ? WHERE id = ?').run(hash, mustChangePw, "u1");
  db.close();
}

describe("credentialsVersion", () => {
  it("is stable, short, and does not contain the hash", () => {
    const v = credentialsVersion("$argon2id$hash-A");
    expect(v).toBe(credentialsVersion("$argon2id$hash-A"));
    expect(v).toHaveLength(16);
    expect(v).toMatch(/^[0-9a-f]{16}$/);
    expect("$argon2id$hash-A").not.toContain(v);
  });

  it("differs for a different hash", () => {
    expect(credentialsVersion("$argon2id$hash-A")).not.toBe(credentialsVersion("$argon2id$hash-B"));
  });
});

describe("isSessionCurrent", () => {
  it("accepts a token issued under the password the account has", () => {
    expect(isSessionCurrent("u1", credentialsVersion("$argon2id$hash-A"))).toBe(true);
  });

  it("refuses a token issued before a password change", () => {
    const oldToken = credentialsVersion("$argon2id$hash-A");
    expect(isSessionCurrent("u1", oldToken)).toBe(true);

    changePassword("$argon2id$hash-B");

    expect(isSessionCurrent("u1", oldToken)).toBe(false);
    // The session opened by the change itself carries the new fingerprint.
    expect(isSessionCurrent("u1", credentialsVersion("$argon2id$hash-B"))).toBe(true);
  });

  it("refuses a token with no fingerprint, an unknown user and an unreadable database", async () => {
    expect(isSessionCurrent("u1", undefined)).toBe(false);
    expect(isSessionCurrent("u1", "")).toBe(false);
    expect(isSessionCurrent(undefined, credentialsVersion("$argon2id$hash-A"))).toBe(false);
    expect(isSessionCurrent("nobody", credentialsVersion("$argon2id$hash-A"))).toBe(false);

    process.env.DATABASE_URL = `file:${path.join(dir, "missing.db")}`;
    expect(isSessionCurrent("u1", credentialsVersion("$argon2id$hash-A"))).toBe(false);
  });
});

describe("the jwt callback", () => {
  const jwt = authConfig.callbacks.jwt as unknown as (
    args: Record<string, unknown>,
  ) => Record<string, unknown>;

  it("stamps the fingerprint the sign-in came with", () => {
    const token = jwt({
      token: {},
      user: { id: "u1", username: "jordi", mustChangePw: false, pwv: "abc123" },
    });
    expect(token.pwv).toBe("abc123");
  });

  it("refreshes the flag and the fingerprint from the row on an update, not from the caller", () => {
    changePassword("$argon2id$hash-B", 0);
    const token = jwt({
      token: { id: "u1", mustChangePw: true, pwv: credentialsVersion("$argon2id$hash-A") },
      trigger: "update",
      session: { user: { mustChangePw: true, pwv: "forged" } },
    });
    expect(token.mustChangePw).toBe(false);
    expect(token.pwv).toBe(credentialsVersion("$argon2id$hash-B"));
  });

  it("does not let a browser clear the temporary-password flag", () => {
    // The row still says the password is temporary.
    const token = jwt({
      token: { id: "u1", mustChangePw: true, pwv: credentialsVersion("$argon2id$hash-A") },
      trigger: "update",
      session: { user: { mustChangePw: false } },
    });
    expect(token.mustChangePw).toBe(true);
  });

  it("leaves the token alone when there is no update", () => {
    const before = { id: "u1", mustChangePw: true, pwv: credentialsVersion("$argon2id$hash-A") };
    expect(jwt({ token: { ...before } })).toEqual(before);
    expect(currentCredentials("u1")?.mustChangePw).toBe(true);
  });
});

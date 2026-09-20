import { createHash } from "node:crypto";
import Database from "better-sqlite3";

/**
 * What ties a session to the password it was issued under.
 *
 * The session is a JWT in a cookie, so nothing about it lives on the server
 * and nothing can revoke it. This gives it one thing to be checked against:
 * a short fingerprint of the account's password hash, carried in the token
 * (`pwv`) and compared with the row on every request. Changing the password
 * (or resetting it with `create-user --reset`) changes the hash, so every
 * token issued before is refused from that moment, with no new column and no
 * migration.
 *
 * Deliberately its own small module and not part of `service.ts`: the proxy
 * runs it before every request, and pulling `service.ts` in would put Prisma
 * and Argon2 in that file. It needs only the SQLite driver the app already
 * ships, read-only, one indexed lookup by primary key.
 */

/** 64 bits of a SHA-256: enough that a token cannot guess it, and it reveals
 * nothing about the hash it came from. */
export function credentialsVersion(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);
}

interface Row {
  passwordHash: string;
  mustChangePw: number;
}

let statement: Database.Statement<[string], Row> | null = null;
let openedFor: string | null = null;

function databasePath(): string {
  // The same reading of DATABASE_URL as `src/lib/prisma.ts`.
  return process.env.DATABASE_URL?.replace("file:", "") ?? "./prisma/dev.db";
}

function lookup(): Database.Statement<[string], Row> {
  const path = databasePath();
  if (!statement || openedFor !== path) {
    const db = new Database(path, { readonly: true, fileMustExist: true });
    statement = db.prepare("SELECT passwordHash, mustChangePw FROM User WHERE id = ?");
    openedFor = path;
  }
  return statement;
}

export interface CredentialsState {
  version: string;
  mustChangePw: boolean;
}

/** The account's current state, or `null` when there is no such user (or the
 * database cannot be read: an unanswerable question is a refusal, never a
 * pass). */
export function currentCredentials(userId: string): CredentialsState | null {
  try {
    const row = lookup().get(userId);
    if (!row) return null;
    return { version: credentialsVersion(row.passwordHash), mustChangePw: row.mustChangePw === 1 };
  } catch {
    return null;
  }
}

/** Whether a token's fingerprint is the one the account has now. */
export function isSessionCurrent(userId: string | undefined, tokenVersion: string | undefined): boolean {
  if (!userId || !tokenVersion) return false;
  return currentCredentials(userId)?.version === tokenVersion;
}

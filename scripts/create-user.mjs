#!/usr/bin/env node
/**
 * Creates a login, resets the password of one that exists, lists the
 * accounts or deletes one.
 *
 *   npm run create-user -- --username jordi
 *   npm run create-user -- --username jordi --reset
 *   pbpaste | npm run create-user -- --username jordi --stdin
 *   npm run create-user -- --list
 *   npm run create-user -- --username jordi --delete --yes
 *
 * There is no HTTP route that does this on purpose: an endpoint that
 * mints accounts is a door, and this app wants exactly one. It also runs
 * inside the container, which is why it talks to SQLite through
 * better-sqlite3 rather than the Prisma client — the production image
 * ships compiled JavaScript and the Prisma client here is TypeScript
 * that only Next's build ever compiles. Two columns of hand-written SQL
 * is the price; the schema they touch is in prisma/schema.prisma.
 */
import { randomBytes, randomInt } from "node:crypto";
import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { Algorithm, hash } from "@node-rs/argon2";

// Same parameters as src/lib/auth/password.ts. Keep them in step: a hash
// written here is verified there.
const ARGON2_OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

/** No look-alikes (0/O, 1/l/I): this gets read off a screen and typed. */
const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const GENERATED_LENGTH = 20;

function parseArgs(argv) {
  const args = { username: null, reset: false, stdin: false, list: false, remove: false, yes: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--username" || arg === "-u") args.username = argv[++i];
    else if (arg.startsWith("--username=")) args.username = arg.slice(11);
    else if (arg === "--reset") args.reset = true;
    else if (arg === "--stdin") args.stdin = true;
    else if (arg === "--list") args.list = true;
    else if (arg === "--delete") args.remove = true;
    else if (arg === "--yes") args.yes = true;
    else fail(`Unknown argument: ${arg}`);
  }
  return args;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function generatePassword() {
  let out = "";
  for (let i = 0; i < GENERATED_LENGTH; i++) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8").split("\n")[0].trim();
}

/** Shaped like the ids Prisma's `cuid()` produces, for a table whose
 * other rows come from Prisma. */
function cuid() {
  return `c${Date.now().toString(36)}${randomBytes(8).toString("hex")}`;
}

function databaseFile() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    fail(
      "DATABASE_URL is not set. In development it lives in .env " +
        "(file:./dev.db); in the container it is already exported.",
    );
  }
  return url.replace(/^file:/, "");
}

function openDatabase() {
  const db = new Database(databaseFile());
  // Deleting an account relies on ON DELETE CASCADE to take its wardrobe
  // with it; be explicit rather than lean on the driver's default.
  db.pragma("foreign_keys = ON");
  return db;
}

/** Same rule as `getUploadDir()` in src/lib/uploads.ts. */
function uploadDir() {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");
}

/** Never prints a hash: username, dates, and whether each thing exists. */
function listAccounts() {
  const db = openDatabase();
  const rows = db
    .prepare(
      `SELECT u.username, u.createdAt, u.lastLoginAt, u.mustChangePw,
              u.recoveryHash IS NOT NULL AS hasRecovery,
              (SELECT COUNT(*) FROM Garment g WHERE g.userId = u.id) AS garments
         FROM User u ORDER BY u.createdAt`,
    )
    .all();
  db.close();
  if (rows.length === 0) return console.log("No accounts.");
  for (const r of rows) {
    console.log(
      [
        r.username.padEnd(20),
        `created ${r.createdAt.slice(0, 10)}`,
        `last login ${r.lastLoginAt ? r.lastLoginAt.slice(0, 10) : "never"}`,
        `${r.garments} garments`,
        r.mustChangePw ? "temporary password" : "password set",
        r.hasRecovery ? "recovery code" : "no recovery code",
      ].join("  |  "),
    );
  }
}

function deleteAccount(username, yes) {
  if (!username) fail("Usage: npm run create-user -- --username <name> --delete --yes");
  const db = openDatabase();
  const user = db.prepare("SELECT id FROM User WHERE username = ?").get(username);
  if (!user) fail(`No account called "${username}".`);

  const counts = {
    garments: db.prepare("SELECT COUNT(*) n FROM Garment WHERE userId = ?").get(user.id).n,
    outfits: db.prepare("SELECT COUNT(*) n FROM Outfit WHERE userId = ?").get(user.id).n,
    days: db.prepare("SELECT COUNT(*) n FROM WornEvent WHERE userId = ?").get(user.id).n,
  };
  if (!yes) {
    fail(
      `This deletes "${username}" with ${counts.garments} garments, ${counts.outfits} outfits ` +
        `and ${counts.days} days, and their photos. It cannot be undone. Add --yes to do it.`,
    );
  }

  // Photos are named after their garment or day, and the rows that name them
  // are about to go: collect the files first.
  const photos = [
    ...db.prepare("SELECT image FROM Garment WHERE userId = ? AND image IS NOT NULL").all(user.id),
    ...db.prepare("SELECT image FROM WornEvent WHERE userId = ? AND image IS NOT NULL").all(user.id),
  ].map((r) => r.image);

  db.prepare("DELETE FROM User WHERE id = ?").run(user.id);
  db.prepare("DELETE FROM LoginAttempt WHERE username = ?").run(username);
  db.close();

  let removed = 0;
  for (const image of photos) {
    for (const name of [image, image.replace(/\.webp$/, "-thumb.webp")]) {
      const file = path.join(uploadDir(), name);
      if (existsSync(file)) {
        unlinkSync(file);
        removed++;
      }
    }
  }
  console.log(`Deleted "${username}" (${counts.garments} garments, ${counts.outfits} outfits, ${counts.days} days, ${removed} photo files).`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.list) return listAccounts();
  const username = args.username?.trim().toLowerCase();
  if (args.remove) return deleteAccount(username, args.yes);

  if (!username) fail("Usage: npm run create-user -- --username <name> [--reset] [--stdin]");
  if (!/^[a-z0-9._-]{2,32}$/.test(username)) {
    fail("Username must be 2-32 chars of a-z, 0-9, dot, dash or underscore.");
  }

  const password = args.stdin ? await readStdin() : generatePassword();
  if (password.length < 12 || password.length > 128) fail("Password must be 12 to 128 characters.");

  const db = openDatabase();
  const existing = db.prepare("SELECT id FROM User WHERE username = ?").get(username);

  if (existing && !args.reset) {
    fail(`User "${username}" already exists. Pass --reset to set a new password.`);
  }

  const passwordHash = await hash(password, ARGON2_OPTIONS);

  if (existing) {
    db.prepare(
      // The recovery code goes with the password it was issued for, and this
      // one is temporary: the person gets a new code when they choose theirs.
      "UPDATE User SET passwordHash = ?, mustChangePw = 1, recoveryHash = NULL WHERE id = ?",
    ).run(passwordHash, existing.id);
  } else {
    db.prepare(
      `INSERT INTO User (id, username, passwordHash, mustChangePw, createdAt)
       VALUES (?, ?, ?, 1, ?)`,
    ).run(cuid(), username, passwordHash, new Date().toISOString());
  }

  // Whatever the old password was, the attempts counted against it are
  // no longer evidence: a reset must not start behind a lockout.
  db.prepare("DELETE FROM LoginAttempt WHERE username = ?").run(username);
  db.close();

  console.log(`${existing ? "Password reset for" : "Created"} "${username}".`);
  if (!args.stdin) console.log(`Password: ${password}`);
  console.log("It is temporary: the app asks for a new one at first login, and shows a recovery code then.");
}

main().catch((error) => fail(error?.message ?? String(error)));

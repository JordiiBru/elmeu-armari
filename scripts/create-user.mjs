#!/usr/bin/env node
/**
 * Creates a login, or resets the password of one that exists.
 *
 *   npm run create-user -- --username jordi
 *   npm run create-user -- --username jordi --reset
 *   pbpaste | npm run create-user -- --username jordi --stdin
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
  const args = { username: null, reset: false, stdin: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--username" || arg === "-u") args.username = argv[++i];
    else if (arg.startsWith("--username=")) args.username = arg.slice(11);
    else if (arg === "--reset") args.reset = true;
    else if (arg === "--stdin") args.stdin = true;
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const username = args.username?.trim().toLowerCase();

  if (!username) fail("Usage: npm run create-user -- --username <name> [--reset] [--stdin]");
  if (!/^[a-z0-9._-]{2,32}$/.test(username)) {
    fail("Username must be 2-32 chars of a-z, 0-9, dot, dash or underscore.");
  }

  const password = args.stdin ? await readStdin() : generatePassword();
  if (password.length < 12) fail("Password must be at least 12 characters.");

  const db = new Database(databaseFile());
  const existing = db.prepare("SELECT id FROM User WHERE username = ?").get(username);

  if (existing && !args.reset) {
    fail(`User "${username}" already exists. Pass --reset to set a new password.`);
  }

  const passwordHash = await hash(password, ARGON2_OPTIONS);

  if (existing) {
    db.prepare(
      "UPDATE User SET passwordHash = ?, mustChangePw = 1 WHERE id = ?",
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
  console.log("It is temporary: the app asks for a new one at first login.");
}

main().catch((error) => fail(error?.message ?? String(error)));

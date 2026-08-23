import { execFileSync } from "node:child_process";
import Database from "better-sqlite3";
import { E2E_USERNAME, E2E_PASSWORD } from "./credentials";

const DATABASE_URL = process.env.DATABASE_URL ?? "file:/tmp/e2e.db";

/**
 * Every screen is behind a login now, so the suite needs an account
 * before it can do anything. It also runs the migrations: the e2e
 * database is a scratch file that may not exist yet, and `npm run dev`
 * does not create it.
 */
export default function globalSetup() {
  const env = { ...process.env, DATABASE_URL };

  execFileSync("npx", ["prisma", "migrate", "deploy"], { env, stdio: "inherit" });
  execFileSync(
    "node",
    ["scripts/create-user.mjs", "--username", E2E_USERNAME, "--reset", "--stdin"],
    { env, input: E2E_PASSWORD, stdio: ["pipe", "inherit", "inherit"] },
  );

  // The account is created with a temporary password on purpose; the
  // suite is not here to re-test that flow on every spec, and
  // auth.spec.ts covers the gate itself.
  const db = new Database(DATABASE_URL.replace(/^file:/, ""));
  db.prepare("UPDATE User SET mustChangePw = 0 WHERE username = ?").run(E2E_USERNAME);
  db.prepare("DELETE FROM LoginAttempt").run();
  db.close();
}

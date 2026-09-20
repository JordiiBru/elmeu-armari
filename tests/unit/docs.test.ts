import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");
const DOCS = ["README.md", "AGENTS.md", "CONTRIBUTING.md", "DESIGN-BIBLE.md", "SECURITY.md"];
const read = (file: string) => readFileSync(path.join(ROOT, file), "utf8");

// Docs drift silently: a file is renamed, a script dropped, and the prose
// keeps pointing at it (DESIGN-BIBLE named a `ui-strings.ts` that never
// existed here). Everything a doc names in backticks has to be real.
const PATH_TOKEN = /^(?:src|tests|scripts|prisma|messages|public|\.github)\/[\w./@()[\]-]+$/;
const ROOT_FILES = /^(?:[\w-]+\.(?:json|jsonc|ts|mjs|yml|yaml|md|sh)|Dockerfile)$/;
// Not committed, so absent from a fresh checkout until a generate step runs.
const GENERATED = ["src/generated", "dev.db", ".env"];

function inlineCode(text: string): string[] {
  return [...text.matchAll(/`([^`\n]+)`/g)].map((m) => m[1].trim());
}

const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "generated", "data", "test-results"]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (SKIP_DIRS.has(name)) return [];
    return statSync(full).isDirectory() ? sourceFiles(full) : [full];
  });
}

const ALL_FILES = sourceFiles(ROOT);
const BASENAMES = new Set(ALL_FILES.map((f) => path.basename(f)));

// A bare name (`service.ts`, `ci.yml`) is a shorthand for a file in the
// directory the sentence is about, so it only has to exist somewhere.
// `middleware.ts` is the name Next 16 retired, which AGENTS.md mentions on purpose.
const HISTORICAL = new Set(["middleware.ts"]);

function exists(token: string): boolean {
  if (PATH_TOKEN.test(token)) return existsSync(path.join(ROOT, token));
  return HISTORICAL.has(token) || BASENAMES.has(token);
}

describe("documentation", () => {
  for (const doc of DOCS) {
    it(`${doc}: every file it names exists`, () => {
      const missing = inlineCode(read(doc))
        .filter((t) => PATH_TOKEN.test(t) || ROOT_FILES.test(t))
        .filter((t) => !GENERATED.some((g) => t.startsWith(g)))
        .filter((t) => !exists(t));
      expect(missing).toEqual([]);
    });

    it(`${doc}: every relative link points at a file that exists`, () => {
      const missing = [...read(doc).matchAll(/\]\((\.\/[^)#\s]+)/g)]
        .map((m) => m[1])
        .filter((target) => !existsSync(path.join(ROOT, target)));
      expect(missing).toEqual([]);
    });

    it(`${doc}: every npm script it names exists`, () => {
      const scripts = Object.keys(JSON.parse(read("package.json")).scripts);
      const named = [...read(doc).matchAll(/npm run ([\w:-]+)/g)].map((m) => m[1]);
      expect(named.filter((s) => !scripts.includes(s))).toEqual([]);
    });
  }

  it("README documents every environment variable the code reads, and no other", () => {
    const readme = read("README.md");
    const table = readme.slice(readme.indexOf("### Environment variables"));
    const documented = new Set(
      [...table.matchAll(/^\| `([A-Z][A-Z0-9_]+)`/gm)].map((m) => m[1]),
    );
    const read_ = new Set(
      ALL_FILES.filter((f) => f.startsWith(path.join(ROOT, "src")) && /\.tsx?$/.test(f)).flatMap((file) =>
        [...readFileSync(file, "utf8").matchAll(/process\.env\.([A-Z][A-Z0-9_]+)/g)].map((m) => m[1]),
      ),
    );
    // Set by the platform or by Next itself, never by whoever runs the app.
    for (const platform of ["NODE_ENV", "NEXT_RUNTIME", "NEXT_PHASE", "CI"]) read_.delete(platform);
    // Read by Next (`PORT`) and by Auth.js (`AUTH_*`), not by our own code.
    const byLibraries = new Set(["PORT", "AUTH_SECRET", "AUTH_URL"]);
    const own = [...read_].filter((v) => !documented.has(v));
    const stale = [...documented].filter((v) => !byLibraries.has(v) && !read_.has(v));
    expect({ undocumented: own, notRead: stale }).toEqual({ undocumented: [], notRead: [] });
  });
});

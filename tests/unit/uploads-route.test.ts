import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import os from "os";
import path from "path";
import fs from "fs/promises";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/api", () => ({ requireSession: vi.fn(async () => null) }));

const { GET } = await import("@/app/api/uploads/[filename]/route");

let dir: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "uploads-route-"));
  process.env.UPLOAD_DIR = dir;
  await fs.writeFile(path.join(dir, "abc123.webp"), "photo");
  await fs.writeFile(path.join(dir, "abc123-thumb.webp"), "thumb");
  await fs.writeFile(path.join(dir, "abc123-cutout.webp"), "cutout");
});

afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

async function get(filename: string) {
  const res = await GET(new NextRequest(`http://localhost/api/uploads/${encodeURIComponent(filename)}`), {
    params: Promise.resolve({ filename }),
  });
  return { status: res.status, body: res.status === 200 ? await res.text() : null, cache: res.headers.get("Cache-Control") };
}

describe("GET /api/uploads/[filename] allowlist", () => {
  it("serves a photo, its thumbnail and its cut-out, privately cached", async () => {
    expect(await get("abc123.webp")).toMatchObject({ status: 200, body: "photo" });
    expect(await get("abc123-thumb.webp")).toMatchObject({ status: 200, body: "thumb" });
    const cutout = await get("abc123-cutout.webp");
    expect(cutout).toMatchObject({ status: 200, body: "cutout" });
    expect(cutout.cache).toContain("private");
  });

  it("answers 404 for a cut-out that does not exist, without falling back to the photo", async () => {
    expect((await get("nothere-cutout.webp")).status).toBe(404);
    await fs.unlink(path.join(dir, "abc123-cutout.webp"));
    expect((await get("abc123-cutout.webp")).status).toBe(404);
  });

  it("still falls back from a missing thumbnail to the photo", async () => {
    await fs.unlink(path.join(dir, "abc123-thumb.webp"));
    expect(await get("abc123-thumb.webp")).toMatchObject({ status: 200, body: "photo" });
  });

  it.each([
    "../abc123.webp",
    "..%2Fabc123.webp",
    "abc123-cutout-thumb.webp",
    "abc123-thumb-cutout.webp",
    "abc123-cutout-cutout.webp",
    "abc123--cutout.webp",
    "-cutout.webp",
    "ABC123-cutout.webp",
    "abc123-cutout.webp.png",
    "abc123-cutout.png",
    "abc123-cutout.webp ",
    "abc123-other.webp",
    "abc123/cutout.webp",
    "abc123-cutout.WEBP",
  ])("rejects %s", async (filename) => {
    expect((await get(filename)).status).toBe(400);
  });
});

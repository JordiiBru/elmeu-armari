import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import os from "os";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import {
  saveUploadImage,
  saveGarmentCutout,
  deleteUploadImage,
  deleteCutout,
  listCutouts,
  encodeCutout,
  cutoutName,
} from "@/lib/uploads";

let dir: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "cutout-test-"));
  process.env.UPLOAD_DIR = dir;
  process.env.BG_REMOVAL_URL = "http://rembg.test:7000";
});

afterEach(async () => {
  vi.unstubAllGlobals();
  delete process.env.BG_REMOVAL_URL;
  await fs.rm(dir, { recursive: true, force: true });
});

/** A flat-colour photo, like a garment on a plain ground. */
function photo(width = 400, height = 300): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 200, g: 200, b: 200 } },
  })
    .jpeg()
    .toBuffer();
}

/** What the sidecar returns: the garment (a red ellipse, so it has real
 * transparent corners like a garment does) on transparency. */
function sidecarCutout(
  width = 400,
  height = 300,
  block = { left: 100, top: 60, width: 200, height: 180 },
): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${block.width}" height="${block.height}">
    <ellipse cx="${block.width / 2}" cy="${block.height / 2}" rx="${block.width / 2}" ry="${block.height / 2}" fill="rgb(200,20,40)"/>
  </svg>`;
  return sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: Buffer.from(svg), left: block.left, top: block.top }])
    .png()
    .toBuffer();
}

function stubSidecar(body: Buffer | null, status = 200) {
  const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    void url;
    void init;
    return body
      ? new Response(new Uint8Array(body), { status })
      : new Response("nope", { status: 500 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("saveGarmentCutout", () => {
  it("stores a trimmed WebP with alpha next to the photo", async () => {
    const fetchMock = stubSidecar(await sidecarCutout());
    const buffer = await photo();
    await saveUploadImage(buffer, "abc123");

    expect(await saveGarmentCutout(buffer, "abc123")).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://rembg.test:7000/remove");

    const stored = sharp(path.join(dir, "abc123-cutout.webp"));
    const meta = await stored.metadata();
    expect(meta.format).toBe("webp");
    expect(meta.hasAlpha).toBe(true);
    // Trimmed to the piece, not the 400x300 frame of the photo.
    expect(meta.width).toBeLessThanOrEqual(202);
    expect(meta.height).toBeLessThanOrEqual(182);
    // The original and its thumbnail are untouched.
    await expect(fs.stat(path.join(dir, "abc123.webp"))).resolves.toBeTruthy();
    await expect(fs.stat(path.join(dir, "abc123-thumb.webp"))).resolves.toBeTruthy();
  });

  it("does nothing, and says so, when no sidecar is configured", async () => {
    delete process.env.BG_REMOVAL_URL;
    const fetchMock = stubSidecar(await sidecarCutout());
    expect(await saveGarmentCutout(await photo(), "abc123")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await listCutouts()).toEqual(new Set());
  });

  it("never throws when the sidecar fails: the garment keeps its photo", async () => {
    stubSidecar(null);
    expect(await saveGarmentCutout(await photo(), "abc123")).toBe(false);
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("connection refused"); }));
    expect(await saveGarmentCutout(await photo(), "abc123")).toBe(false);
    expect(await listCutouts()).toEqual(new Set());
  });

  it("rejects a failed mask: a sliver is not a garment", async () => {
    const sliver = await sidecarCutout(400, 300, { left: 10, top: 10, width: 8, height: 8 });
    stubSidecar(sliver);
    expect(await saveGarmentCutout(await photo(), "abc123")).toBe(false);
    expect(await listCutouts()).toEqual(new Set());
  });

  it("replaces a stale cut-out from a previous photo when the new one fails", async () => {
    await fs.writeFile(path.join(dir, cutoutName("abc123")), Buffer.from("old"));
    stubSidecar(null);
    expect(await saveGarmentCutout(await photo(), "abc123")).toBe(false);
    expect(await listCutouts()).toEqual(new Set());
  });

  it("treats a photo that already has a transparent ground as its own cut-out", async () => {
    const fetchMock = stubSidecar(null);
    const alreadyCutOut = await sidecarCutout();
    expect(await saveGarmentCutout(alreadyCutOut, "abc123")).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await listCutouts()).toEqual(new Set(["abc123-cutout.webp"]));
  });
});

describe("cut-out files", () => {
  it("deleteUploadImage removes the photo, the thumbnail and the cut-out", async () => {
    stubSidecar(await sidecarCutout());
    const buffer = await photo();
    await saveUploadImage(buffer, "abc123");
    await saveGarmentCutout(buffer, "abc123");
    expect(await fs.readdir(dir)).toHaveLength(3);

    await deleteUploadImage("abc123");
    expect(await fs.readdir(dir)).toEqual([]);
  });

  it("deleteCutout is quiet about a cut-out that is not there", async () => {
    await expect(deleteCutout("nothing")).resolves.toBeUndefined();
  });

  it("listCutouts lists only cut-outs, and survives a missing directory", async () => {
    await fs.writeFile(path.join(dir, "a.webp"), "x");
    await fs.writeFile(path.join(dir, "a-thumb.webp"), "x");
    await fs.writeFile(path.join(dir, "a-cutout.webp"), "x");
    expect(await listCutouts()).toEqual(new Set(["a-cutout.webp"]));
    process.env.UPLOAD_DIR = path.join(dir, "missing");
    expect(await listCutouts()).toEqual(new Set());
  });

  it("encodeCutout returns null for an empty mask", async () => {
    const empty = await sharp({
      create: { width: 50, height: 50, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .png()
      .toBuffer();
    expect(await encodeCutout(empty)).toBeNull();
  });
});

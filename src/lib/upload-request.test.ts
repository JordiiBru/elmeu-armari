import { describe, it, expect, afterAll } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { NextRequest } from "next/server";
import { readImageUpload } from "./upload-request";
import { saveUploadImage } from "./uploads";

function uploadRequest(file: File, headers: Record<string, string> = {}): NextRequest {
  const body = new FormData();
  body.set("file", file);
  return new NextRequest("http://localhost/api/x/image", { method: "POST", body, headers });
}

const png = () =>
  sharp({ create: { width: 8, height: 8, channels: 3, background: "#123456" } })
    .png()
    .toBuffer();

describe("readImageUpload", () => {
  it("returns the bytes of a JPEG, PNG or WebP", async () => {
    const bytes = await png();
    const result = await readImageUpload(uploadRequest(new File([new Uint8Array(bytes)], "a.png", { type: "image/png" })));
    expect("buffer" in result && result.buffer.length).toBe(bytes.length);
  });

  it("refuses a declared type that is not an image with 415", async () => {
    const result = await readImageUpload(uploadRequest(new File(["<svg/>"], "a.svg", { type: "image/svg+xml" })));
    expect("response" in result && result.response.status).toBe(415);
  });

  it("refuses a body over the limit from Content-Length alone, before reading it", async () => {
    const request = uploadRequest(new File(["x"], "a.png", { type: "image/png" }), {
      "content-length": String(500 * 1024 * 1024),
    });
    const result = await readImageUpload(request);
    expect("response" in result && result.response.status).toBe(413);
  });

  it("answers 400 when there is no file", async () => {
    const request = new NextRequest("http://localhost/api/x/image", { method: "POST", body: new FormData() });
    const result = await readImageUpload(request);
    expect("response" in result && result.response.status).toBe(400);
  });
});

describe("saveUploadImage rejects what is not a usable image", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "uploads-"));
  const previous = process.env.UPLOAD_DIR;
  process.env.UPLOAD_DIR = dir;
  afterAll(() => {
    if (previous === undefined) delete process.env.UPLOAD_DIR;
    else process.env.UPLOAD_DIR = previous;
    rmSync(dir, { recursive: true, force: true });
  });

  it("throws for bytes that only claim to be an image", async () => {
    await expect(saveUploadImage(Buffer.from("not an image at all"), "fake")).rejects.toThrow();
  });

  it("throws for a canvas above the pixel limit (decompression bomb)", async () => {
    const huge = await sharp({ create: { width: 8000, height: 8000, channels: 3, background: "#000" } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    await expect(saveUploadImage(huge, "bomb")).rejects.toThrow();
  });
});

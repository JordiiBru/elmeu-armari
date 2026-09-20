import { describe, it, expect } from "vitest";
import { requireSameOrigin } from "@/lib/auth/same-origin";

const post = (headers: Record<string, string>) =>
  requireSameOrigin(new Request("https://armari.example.com/api/import", { method: "POST", headers }));

describe("requireSameOrigin", () => {
  it("lets a same-origin fetch through, and a direct navigation", () => {
    expect(post({ "sec-fetch-site": "same-origin" })).toBeNull();
    expect(post({ "sec-fetch-site": "none" })).toBeNull();
  });

  it("refuses a sibling subdomain even though it is same-site", () => {
    expect(post({ "sec-fetch-site": "same-site" })?.status).toBe(403);
    expect(post({ "sec-fetch-site": "cross-site" })?.status).toBe(403);
  });

  it("falls back to Origin against the forwarded host for browsers without Sec-Fetch-Site", () => {
    const host = { "x-forwarded-host": "armari.example.com" };
    expect(post({ ...host, origin: "https://armari.example.com" })).toBeNull();
    expect(post({ ...host, origin: "https://other.example.com" })?.status).toBe(403);
    expect(post({ ...host, origin: "not a url" })?.status).toBe(403);
  });

  it("lets a request with neither header through: it is not a browser acting for a page", () => {
    expect(post({})).toBeNull();
  });
});

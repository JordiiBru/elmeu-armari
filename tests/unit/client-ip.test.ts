import { describe, it, expect } from "vitest";
import { UNKNOWN_IP, clientIp } from "@/lib/auth/request";

function headers(entries: Record<string, string>): Headers {
  return new Headers(entries);
}

describe("clientIp", () => {
  it("prefers what Cloudflare says", () => {
    expect(
      clientIp(
        headers({ "cf-connecting-ip": "203.0.113.7", "x-forwarded-for": "10.0.0.1" }),
      ),
    ).toBe("203.0.113.7");
  });

  it("takes the first hop of a forwarded chain", () => {
    expect(clientIp(headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe(
      "203.0.113.7",
    );
  });

  it("falls back to x-real-ip", () => {
    expect(clientIp(headers({ "x-real-ip": "203.0.113.7" }))).toBe("203.0.113.7");
  });

  it("says so when the request carries no address at all", () => {
    expect(clientIp(headers({}))).toBe(UNKNOWN_IP);
  });
});

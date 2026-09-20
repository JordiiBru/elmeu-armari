import { describe, it, expect } from "vitest";
import { isAllowedHost } from "@/lib/security/host";

const AUTH_URL = "https://armari.jordibru.cloud";

describe("isAllowedHost", () => {
  it("answers to the public name, with or without a port and in any case", () => {
    expect(isAllowedHost("armari.jordibru.cloud", AUTH_URL)).toBe(true);
    expect(isAllowedHost("Armari.JordiBru.cloud:443", AUTH_URL)).toBe(true);
  });

  it("answers to localhost", () => {
    expect(isAllowedHost("localhost:3000", AUTH_URL)).toBe(true);
  });

  it("lets the kubelet in: its probe arrives with the pod address as Host", () => {
    expect(isAllowedHost("10.42.0.54:3000", AUTH_URL)).toBe(true);
    expect(isAllowedHost("[::1]:3000", AUTH_URL)).toBe(true);
  });

  it("refuses any other name, a lookalike or a missing Host", () => {
    expect(isAllowedHost("evil.example.com", AUTH_URL)).toBe(false);
    expect(isAllowedHost("armari.jordibru.cloud.evil.com", AUTH_URL)).toBe(false);
    expect(isAllowedHost("kfc.jordibru.cloud", AUTH_URL)).toBe(false);
    expect(isAllowedHost(null, AUTH_URL)).toBe(false);
    expect(isAllowedHost("", AUTH_URL)).toBe(false);
  });

  it("fails closed when AUTH_URL is missing or malformed", () => {
    expect(isAllowedHost("armari.jordibru.cloud", undefined)).toBe(false);
    expect(isAllowedHost("armari.jordibru.cloud", "not a url")).toBe(false);
    expect(isAllowedHost("localhost", undefined)).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { buildContentSecurityPolicy, newNonce } from "@/lib/security/csp";

const directive = (csp: string, name: string) =>
  csp.split("; ").find((d) => d.startsWith(`${name} `)) ?? "";

describe("buildContentSecurityPolicy", () => {
  it("has no 'unsafe-inline' or 'unsafe-eval' in script-src in production", () => {
    const script = directive(buildContentSecurityPolicy("abc", false), "script-src");
    expect(script).toContain("'nonce-abc'");
    expect(script).toContain("'strict-dynamic'");
    expect(script).not.toContain("'unsafe-inline'");
    expect(script).not.toContain("'unsafe-eval'");
  });

  it("gives dev the eval and the websocket it needs, and production neither", () => {
    const dev = buildContentSecurityPolicy("abc", true);
    const prod = buildContentSecurityPolicy("abc", false);
    expect(directive(dev, "script-src")).toContain("'unsafe-eval'");
    expect(directive(dev, "connect-src")).toContain("ws:");
    expect(directive(prod, "connect-src")).toBe("connect-src 'self'");
    expect(prod).not.toContain("unsafe-eval");
  });

  it("keeps the rest of the policy shut", () => {
    const csp = buildContentSecurityPolicy("abc", false);
    for (const d of ["default-src 'self'", "object-src 'none'", "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'"]) {
      expect(csp).toContain(d);
    }
  });

  it("keeps 'unsafe-inline' for styles only, on purpose", () => {
    const csp = buildContentSecurityPolicy("abc", false);
    expect(directive(csp, "style-src")).toContain("'unsafe-inline'");
    expect(csp.match(/'unsafe-inline'/g)).toHaveLength(1);
  });
});

describe("newNonce", () => {
  it("is different every time and safe inside a header", () => {
    const a = newNonce();
    const b = newNonce();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(a.length).toBeGreaterThanOrEqual(24);
  });
});

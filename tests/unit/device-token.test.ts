import { describe, it, expect } from "vitest";
import { signDeviceToken, verifyDeviceToken } from "@/lib/auth/device";

const SECRET = "a-long-enough-test-secret";

describe("device token", () => {
  it("verifies for the account and password fingerprint it was issued for", () => {
    const token = signDeviceToken("user-1", "abcdef0123456789", SECRET);
    expect(verifyDeviceToken(token, "user-1", "abcdef0123456789", SECRET)).toBe(true);
  });

  it("is refused for another account", () => {
    const token = signDeviceToken("user-1", "abcdef0123456789", SECRET);
    expect(verifyDeviceToken(token, "user-2", "abcdef0123456789", SECRET)).toBe(false);
  });

  it("is refused once the password fingerprint changed", () => {
    const token = signDeviceToken("user-1", "abcdef0123456789", SECRET);
    expect(verifyDeviceToken(token, "user-1", "0000000000000000", SECRET)).toBe(false);
  });

  it("is refused under another secret, when forged, empty or without a secret", () => {
    const token = signDeviceToken("user-1", "abcdef0123456789", SECRET);
    expect(verifyDeviceToken(token, "user-1", "abcdef0123456789", "other-secret")).toBe(false);
    expect(verifyDeviceToken("user-1.abcdef0123456789.forged", "user-1", "abcdef0123456789", SECRET)).toBe(false);
    expect(verifyDeviceToken("", "user-1", "abcdef0123456789", SECRET)).toBe(false);
    expect(verifyDeviceToken(undefined, "user-1", "abcdef0123456789", SECRET)).toBe(false);
    expect(verifyDeviceToken(token, "user-1", "abcdef0123456789", undefined)).toBe(false);
  });
});

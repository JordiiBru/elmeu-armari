import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  passwordPolicyError,
} from "@/lib/auth/policy";

describe("passwordPolicyError", () => {
  it("rejects anything shorter than the minimum", () => {
    expect(passwordPolicyError("a".repeat(MIN_PASSWORD_LENGTH - 1))).toBe("tooShort");
  });

  it("accepts the minimum itself", () => {
    expect(passwordPolicyError("a".repeat(MIN_PASSWORD_LENGTH))).toBeNull();
  });

  it("rejects a password long enough to be a denial of service", () => {
    expect(passwordPolicyError("a".repeat(MAX_PASSWORD_LENGTH + 1))).toBe("tooLong");
  });
});

describe("hashPassword", () => {
  it("produces an Argon2id digest with the agreed cost", async () => {
    const digest = await hashPassword("correct horse battery");
    expect(digest.startsWith("$argon2id$v=19$m=19456,t=2,p=1$")).toBe(true);
  });

  it("salts, so the same password hashes differently every time", async () => {
    const [a, b] = await Promise.all([hashPassword("same one"), hashPassword("same one")]);
    expect(a).not.toBe(b);
  });
});

describe("verifyPassword", () => {
  it("accepts the password it was made from", async () => {
    const digest = await hashPassword("correct horse battery");
    expect(await verifyPassword(digest, "correct horse battery")).toBe(true);
  });

  it("refuses anything else", async () => {
    const digest = await hashPassword("correct horse battery");
    expect(await verifyPassword(digest, "correct horse batteries")).toBe(false);
  });

  it("treats an unreadable digest as a failed login, not a crash", async () => {
    expect(await verifyPassword("not a hash", "correct horse battery")).toBe(false);
  });
});

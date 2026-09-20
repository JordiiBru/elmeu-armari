import { describe, it, expect } from "vitest";
import {
  formatRecoveryCode,
  generateRecoveryCode,
  normalizeRecoveryCode,
} from "@/lib/auth/recovery";

describe("recovery code", () => {
  it("is twenty characters in four groups, with no look-alikes", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateRecoveryCode();
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]{5}(-[A-HJ-NP-Z2-9]{5}){3}$/);
    }
  });

  it("is not the same twice", () => {
    expect(generateRecoveryCode()).not.toBe(generateRecoveryCode());
  });

  it("is compared without regard to case, dashes or spaces", () => {
    const code = "ABCDE-FGHJK-LMNPQ-RSTUV";
    expect(normalizeRecoveryCode(code)).toBe("ABCDEFGHJKLMNPQRSTUV");
    expect(normalizeRecoveryCode("abcde fghjk lmnpq rstuv")).toBe("ABCDEFGHJKLMNPQRSTUV");
    expect(normalizeRecoveryCode(" abcde-fghjk-lmnpq-rstuv\n")).toBe("ABCDEFGHJKLMNPQRSTUV");
  });

  it("formats what it normalizes back into the shown shape", () => {
    expect(formatRecoveryCode("ABCDEFGHJKLMNPQRSTUV")).toBe("ABCDE-FGHJK-LMNPQ-RSTUV");
  });
});

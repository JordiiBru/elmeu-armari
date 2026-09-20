import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashPassword } from "@/lib/auth/password";
import { FAILURES_BEFORE_LOCK } from "@/lib/auth/lockout";

const PASSWORD = "correct horse battery";

interface Row {
  id: string;
  username: string;
  passwordHash: string;
  mustChangePw: boolean;
  recoveryHash?: string | null;
}

const users = new Map<string, Row>();
const touchLastLogin = vi.fn(async () => undefined);
const replaceCredentialsRow = vi.fn(async () => undefined);
const clearAttemptsFor = vi.fn(async () => undefined);
const attemptsByUsername = vi.fn(async () => [] as { success: boolean; createdAt: Date }[]);

// Same reason as the wardrobe's service tests: the repository is the
// only module that touches Prisma, so mocking it leaves a unit test of
// the credential logic itself — hashing included, it is the real Argon2.
vi.mock("@/lib/auth/repository", () => ({
  findUserByUsername: vi.fn(async (username: string) => users.get(username) ?? null),
  findUserById: vi.fn(
    async (id: string) => [...users.values()].find((u) => u.id === id) ?? null,
  ),
  touchLastLogin,
  replaceCredentials: replaceCredentialsRow,
  clearAttemptsFor,
  recordAttempt: vi.fn(async () => undefined),
  recentAttemptsByUsername: (...args: unknown[]) => attemptsByUsername(...(args as [])),
  deleteAttemptsBefore: vi.fn(async () => undefined),
}));

const { verifyCredentials, changePassword, lockoutSeconds, normalizeUsername, gateLogin, deviceTokenFor, recoverAccount } =
  await import("@/lib/auth/service");
const { loginPressure, PRESSURE_MAX_ATTEMPTS } = await import("@/lib/auth/pressure");

beforeEach(async () => {
  users.clear();
  users.set("jordi", {
    id: "user-1",
    username: "jordi",
    passwordHash: await hashPassword(PASSWORD),
    mustChangePw: true,
  });
  touchLastLogin.mockClear();
  replaceCredentialsRow.mockClear();
  clearAttemptsFor.mockClear();
  attemptsByUsername.mockClear();
  attemptsByUsername.mockResolvedValue([]);
});

describe("verifyCredentials", () => {
  it("accepts the right password and reports the temporary flag", async () => {
    const user = await verifyCredentials("jordi", PASSWORD);
    expect(user).toMatchObject({ id: "user-1", username: "jordi", mustChangePw: true });
    // The session is stamped with the fingerprint of the password just checked.
    expect(user?.pwv).toMatch(/^[0-9a-f]{16}$/);
    expect(touchLastLogin).toHaveBeenCalledWith("user-1");
  });

  it("is case and whitespace insensitive about the username", async () => {
    expect(await verifyCredentials("  JORDI ", PASSWORD)).not.toBeNull();
  });

  it("refuses a wrong password", async () => {
    expect(await verifyCredentials("jordi", "not the password")).toBeNull();
    expect(touchLastLogin).not.toHaveBeenCalled();
  });

  it("refuses an unknown user without saying so", async () => {
    expect(await verifyCredentials("ningu", PASSWORD)).toBeNull();
  });

  it("refuses an empty password outright", async () => {
    expect(await verifyCredentials("jordi", "")).toBeNull();
  });
});

describe("lockoutSeconds", () => {
  const failures = (count: number) =>
    Array(count)
      .fill(null)
      .map(() => ({ success: false, createdAt: new Date() }));

  it("is null while the account is under the threshold", async () => {
    attemptsByUsername.mockResolvedValue(failures(FAILURES_BEFORE_LOCK - 1));
    expect(await lockoutSeconds("jordi")).toBeNull();
  });

  it("locks the account after the threshold", async () => {
    attemptsByUsername.mockResolvedValue(failures(FAILURES_BEFORE_LOCK));
    const seconds = await lockoutSeconds("jordi");
    expect(seconds).toBeGreaterThan(0);
    expect(seconds).toBeLessThanOrEqual(60);
  });
});

describe("gateLogin", () => {
  const failures = (count: number) =>
    Array(count)
      .fill(null)
      .map(() => ({ success: false, createdAt: new Date() }));

  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret";
    // Drain whatever a previous test spent from the process-wide budget.
    while (loginPressure.isBusy()) loginPressure.admit();
  });

  it("lets an unknown browser through while the account is open", async () => {
    expect(await gateLogin("jordi", undefined, { spend: false })).toEqual({
      ok: true,
      trusted: false,
    });
  });

  it("closes the account to an unknown browser after the threshold", async () => {
    attemptsByUsername.mockResolvedValue(failures(FAILURES_BEFORE_LOCK));
    const gate = await gateLogin("jordi", undefined, { spend: false });
    expect(gate).toMatchObject({ ok: false, reason: "locked" });
  });

  it("lets a browser that already proved the password through a lockout", async () => {
    const token = await deviceTokenFor("jordi");
    attemptsByUsername.mockResolvedValue(failures(FAILURES_BEFORE_LOCK * 3));
    expect(await gateLogin("jordi", token ?? undefined, { spend: false })).toEqual({
      ok: true,
      trusted: true,
    });
  });

  it("stops trusting a browser once the password has changed", async () => {
    const token = await deviceTokenFor("jordi");
    users.get("jordi")!.passwordHash = await hashPassword("a completely new password");
    attemptsByUsername.mockResolvedValue(failures(FAILURES_BEFORE_LOCK));
    expect(await gateLogin("jordi", token ?? undefined, { spend: false })).toMatchObject({
      ok: false,
      reason: "locked",
    });
  });

  it("does not trust a device token for another account", async () => {
    users.set("ana", {
      id: "user-2",
      username: "ana",
      passwordHash: await hashPassword(PASSWORD),
      mustChangePw: false,
    });
    const anas = await deviceTokenFor("ana");
    attemptsByUsername.mockResolvedValue(failures(FAILURES_BEFORE_LOCK));
    expect(await gateLogin("jordi", anas ?? undefined, { spend: false })).toMatchObject({
      ok: false,
      reason: "locked",
    });
  });

  it("refuses unknown browsers once the global budget is spent, and known ones never spend it", async () => {
    const token = await deviceTokenFor("jordi");
    for (let i = 0; i < PRESSURE_MAX_ATTEMPTS; i++) {
      await gateLogin("jordi", undefined, { spend: true });
    }
    expect(await gateLogin("jordi", undefined, { spend: true })).toEqual({
      ok: false,
      reason: "busy",
    });
    expect(await gateLogin("jordi", token ?? undefined, { spend: true })).toEqual({
      ok: true,
      trusted: true,
    });
  });

  it("does not spend the budget when it only looks", async () => {
    for (let i = 0; i < PRESSURE_MAX_ATTEMPTS * 2; i++) {
      await gateLogin("jordi", undefined, { spend: false });
    }
    expect(loginPressure.isBusy()).toBe(false);
  });
});

describe("changePassword", () => {
  it("replaces the hash and clears the temporary flag", async () => {
    const result = await changePassword("user-1", PASSWORD, "a brand new secret");
    expect(result).toMatchObject({ ok: true });
    expect(replaceCredentialsRow).toHaveBeenCalledTimes(1);
    const [id, hash, recoveryHash] = replaceCredentialsRow.mock.calls[0] as unknown as [
      string,
      string,
      string,
    ];
    expect(id).toBe("user-1");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    // The password and its recovery code change together, and only the hash
    // of the code is stored.
    expect(recoveryHash.startsWith("$argon2id$")).toBe(true);
    if (result.ok) {
      expect(result.recoveryCode).toMatch(/^[A-Z2-9]{5}(-[A-Z2-9]{5}){3}$/);
      expect(recoveryHash).not.toContain(result.recoveryCode);
    }
  });

  it("refuses without the current password", async () => {
    expect(await changePassword("user-1", "wrong", "a brand new secret")).toEqual({
      ok: false,
      error: "wrongPassword",
    });
    expect(replaceCredentialsRow).not.toHaveBeenCalled();
  });

  it("refuses a new password that is too short", async () => {
    expect(await changePassword("user-1", PASSWORD, "short")).toEqual({
      ok: false,
      error: "tooShort",
    });
  });

  it("refuses the password it already has", async () => {
    expect(await changePassword("user-1", PASSWORD, PASSWORD)).toEqual({
      ok: false,
      error: "samePassword",
    });
  });
});

describe("recoverAccount", () => {
  const CODE = "ABCDE-FGHJK-LMNPQ-RSTUV";

  beforeEach(async () => {
    process.env.AUTH_SECRET = "test-secret";
    while (loginPressure.isBusy()) loginPressure.admit();
    users.get("jordi")!.recoveryHash = await hashPassword("ABCDEFGHJKLMNPQRSTUV");
  });

  it("sets a new password and a new code when the code is right, however it is typed", async () => {
    const result = await recoverAccount("Jordi", "abcde fghjk lmnpq rstuv", "a brand new secret");
    expect(result).toMatchObject({ ok: true });
    expect(replaceCredentialsRow).toHaveBeenCalledTimes(1);
    expect(clearAttemptsFor).toHaveBeenCalledWith("jordi");
    if (result.ok) expect(result.recoveryCode).not.toBe(CODE);
  });

  it("refuses a wrong code, an unknown user and an account with no code the same way", async () => {
    const wrong = await recoverAccount("jordi", "AAAAA-AAAAA-AAAAA-AAAAA", "a brand new secret");
    const unknown = await recoverAccount("ningu", CODE, "a brand new secret");
    users.get("jordi")!.recoveryHash = null;
    const none = await recoverAccount("jordi", CODE, "a brand new secret");
    expect(wrong).toEqual({ ok: false, error: "invalid" });
    expect(unknown).toEqual({ ok: false, error: "invalid" });
    expect(none).toEqual({ ok: false, error: "invalid" });
    expect(replaceCredentialsRow).not.toHaveBeenCalled();
  });

  it("refuses a new password outside the policy without touching anything", async () => {
    expect(await recoverAccount("jordi", CODE, "short")).toEqual({ ok: false, error: "tooShort" });
    expect(replaceCredentialsRow).not.toHaveBeenCalled();
  });

  it("spends from the shared attempt budget and refuses once it is gone", async () => {
    for (let i = 0; i < PRESSURE_MAX_ATTEMPTS; i++) loginPressure.admit();
    expect(await recoverAccount("jordi", CODE, "a brand new secret")).toEqual({
      ok: false,
      error: "busy",
    });
  });
});

describe("normalizeUsername", () => {
  it("is what the create-user script writes", () => {
    expect(normalizeUsername("  Jordi  ")).toBe("jordi");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashPassword } from "@/lib/auth/password";
import { FAILURES_BEFORE_LOCK } from "@/lib/auth/lockout";
import { UNKNOWN_IP } from "@/lib/auth/request";

const PASSWORD = "correct horse battery";

interface Row {
  id: string;
  username: string;
  passwordHash: string;
  mustChangePw: boolean;
}

const users = new Map<string, Row>();
const touchLastLogin = vi.fn(async () => undefined);
const setPasswordRow = vi.fn(async () => undefined);
const attemptsByUsername = vi.fn(async () => [] as { success: boolean; createdAt: Date }[]);
const attemptsByIp = vi.fn(async () => [] as { success: boolean; createdAt: Date }[]);

// Same reason as the wardrobe's service tests: the repository is the
// only module that touches Prisma, so mocking it leaves a unit test of
// the credential logic itself — hashing included, it is the real Argon2.
vi.mock("@/lib/auth/repository", () => ({
  findUserByUsername: vi.fn(async (username: string) => users.get(username) ?? null),
  findUserById: vi.fn(
    async (id: string) => [...users.values()].find((u) => u.id === id) ?? null,
  ),
  countUsers: vi.fn(async () => users.size),
  touchLastLogin,
  setPassword: setPasswordRow,
  recordAttempt: vi.fn(async () => undefined),
  recentAttemptsByUsername: (...args: unknown[]) => attemptsByUsername(...(args as [])),
  recentAttemptsByIp: (...args: unknown[]) => attemptsByIp(...(args as [])),
  deleteAttemptsBefore: vi.fn(async () => undefined),
}));

const { verifyCredentials, changePassword, lockoutSeconds, normalizeUsername } =
  await import("@/lib/auth/service");

beforeEach(async () => {
  users.clear();
  users.set("jordi", {
    id: "user-1",
    username: "jordi",
    passwordHash: await hashPassword(PASSWORD),
    mustChangePw: true,
  });
  touchLastLogin.mockClear();
  setPasswordRow.mockClear();
  attemptsByUsername.mockClear();
  attemptsByIp.mockClear();
  attemptsByUsername.mockResolvedValue([]);
  attemptsByIp.mockResolvedValue([]);
});

describe("verifyCredentials", () => {
  it("accepts the right password and reports the temporary flag", async () => {
    const user = await verifyCredentials("jordi", PASSWORD);
    expect(user).toEqual({ id: "user-1", username: "jordi", mustChangePw: true });
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
    expect(await lockoutSeconds("jordi", "10.0.0.1")).toBeNull();
  });

  it("locks the account after the threshold", async () => {
    attemptsByUsername.mockResolvedValue(failures(FAILURES_BEFORE_LOCK));
    const seconds = await lockoutSeconds("jordi", "10.0.0.1");
    expect(seconds).toBeGreaterThan(0);
    expect(seconds).toBeLessThanOrEqual(60);
  });

  it("tolerates four times as many failures from one address", async () => {
    attemptsByIp.mockResolvedValue(failures(FAILURES_BEFORE_LOCK * 4 - 1));
    expect(await lockoutSeconds("jordi", "10.0.0.1")).toBeNull();

    attemptsByIp.mockResolvedValue(failures(FAILURES_BEFORE_LOCK * 4));
    expect(await lockoutSeconds("jordi", "10.0.0.1")).toBeGreaterThan(0);
  });

  it("never throttles an unattributable address, which would lock everyone out", async () => {
    attemptsByIp.mockResolvedValue(failures(100));
    expect(await lockoutSeconds("jordi", UNKNOWN_IP)).toBeNull();
    expect(attemptsByIp).not.toHaveBeenCalled();
  });
});

describe("changePassword", () => {
  it("replaces the hash and clears the temporary flag", async () => {
    const result = await changePassword("user-1", PASSWORD, "a brand new secret");
    expect(result).toEqual({ ok: true });
    expect(setPasswordRow).toHaveBeenCalledTimes(1);
    const [id, hash] = setPasswordRow.mock.calls[0] as unknown as [string, string];
    expect(id).toBe("user-1");
    expect(hash.startsWith("$argon2id$")).toBe(true);
  });

  it("refuses without the current password", async () => {
    expect(await changePassword("user-1", "wrong", "a brand new secret")).toEqual({
      ok: false,
      error: "wrongPassword",
    });
    expect(setPasswordRow).not.toHaveBeenCalled();
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

describe("normalizeUsername", () => {
  it("is what the create-user script writes", () => {
    expect(normalizeUsername("  Jordi  ")).toBe("jordi");
  });
});

import { prisma } from "@/lib/prisma";

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function touchLastLogin(id: string) {
  return prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
}

/** The password and its recovery code change together or not at all: a
 * code that outlived the password it was issued with would open the account
 * to whoever held the old one. Also ends the temporary-password state. */
export async function replaceCredentials(
  id: string,
  passwordHash: string,
  recoveryHash: string,
) {
  return prisma.user.update({
    where: { id },
    data: { passwordHash, recoveryHash, mustChangePw: false },
  });
}

/** Forgets what was counted against an account: once its owner has proved
 * who they are, earlier failures are not evidence of anything. */
export async function clearAttemptsFor(username: string) {
  return prisma.loginAttempt.deleteMany({ where: { username } });
}

export async function recordAttempt(data: {
  username: string;
  ip: string;
  success: boolean;
}) {
  return prisma.loginAttempt.create({ data });
}

/** Newest first, which is the order `lockedUntil` reads them in. */
export async function recentAttemptsByUsername(
  username: string,
  since: Date,
  take: number,
) {
  return prisma.loginAttempt.findMany({
    where: { username, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take,
    select: { success: true, createdAt: true },
  });
}

export async function deleteAttemptsBefore(cutoff: Date) {
  return prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } });
}

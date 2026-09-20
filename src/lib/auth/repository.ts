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

export async function setPassword(id: string, passwordHash: string) {
  return prisma.user.update({
    where: { id },
    data: { passwordHash, mustChangePw: false },
  });
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

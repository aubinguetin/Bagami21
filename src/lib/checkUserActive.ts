import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Check if a user account is active (not suspended)
 * This should be called on every critical API endpoint to ensure real-time enforcement
 */
export async function checkUserActive(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });

    return user?.isActive ?? false;
  } catch (error) {
    console.error('Error checking user active status:', error);
    return false;
  }
}

/**
 * Throws an error if the user is suspended
 * Use this to protect API endpoints
 */
export async function requireActiveUser(userId: string): Promise<void> {
  const isActive = await checkUserActive(userId);
  
  if (!isActive) {
    throw new Error('ACCOUNT_SUSPENDED');
  }
}

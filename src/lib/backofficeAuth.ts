import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';

export interface BackofficeAuth {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSubadmin: boolean;
  userId?: string;
  email?: string;
  permissions?: string[];
}

/**
 * Check if request is authenticated as either admin or subadmin
 * Returns authentication details including permissions for subadmins
 */
export async function checkBackofficeAuth(): Promise<BackofficeAuth> {
  // First, check for subadmin token in cookies
  const cookieStore = cookies();
  const subadminToken = cookieStore.get('subadmin-token')?.value;

  if (subadminToken) {
    try {
      const decoded = verify(
        subadminToken,
        process.env.NEXTAUTH_SECRET || 'your-secret-key'
      ) as {
        subadminId: string;
        email: string;
        permissions: string[];
      };

      return {
        isAuthenticated: true,
        isAdmin: false,
        isSubadmin: true,
        userId: decoded.subadminId,
        email: decoded.email,
        permissions: decoded.permissions,
      };
    } catch (error) {
      console.error('Invalid subadmin token:', error);
    }
  }

  // If no subadmin token, check for NextAuth admin session
  const session = await getServerSession(authOptions);

  if (session?.user?.email) {
    return {
      isAuthenticated: true,
      isAdmin: true,
      isSubadmin: false,
      userId: session.user.id,
      email: session.user.email,
      permissions: undefined, // Admins have all permissions
    };
  }

  // Not authenticated
  return {
    isAuthenticated: false,
    isAdmin: false,
    isSubadmin: false,
  };
}

/**
 * Check if the authenticated user has permission to access a specific section
 * Admins always have access, subadmins need specific permission
 */
export function hasPermission(auth: BackofficeAuth, requiredPermission: string): boolean {
  // Admins have all permissions
  if (auth.isAdmin) {
    return true;
  }

  // Subadmins need specific permission
  if (auth.isSubadmin && auth.permissions) {
    return auth.permissions.includes(requiredPermission);
  }

  return false;
}

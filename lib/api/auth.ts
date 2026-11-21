import { auth } from '@/auth';
import { ApiErrors } from '@/lib/api/error-handler';
import type { Session } from 'next-auth';

export interface ApiSession {
  user: NonNullable<Session['user']> & {
    id: string;
    roles: string[];
  };
  roles: string[];
}

export function hasAnyRole(userRoles: string[], allowedRoles: readonly string[]): boolean {
  return allowedRoles.some((role) => userRoles.includes(role));
}

export async function requireApiSession(): Promise<ApiSession> {
  const session = await auth();

  if (!session?.user?.id) {
    throw ApiErrors.UNAUTHORIZED;
  }

  const roles = session.user.roles || [];

  return {
    user: {
      ...session.user,
      id: session.user.id,
      roles,
    },
    roles,
  };
}

export async function requireApiRoles(allowedRoles: readonly string[]): Promise<ApiSession> {
  const session = await requireApiSession();

  if (!hasAnyRole(session.roles, allowedRoles)) {
    throw ApiErrors.FORBIDDEN;
  }

  return session;
}

/**
 * Auth + prérequis coss pour les routes /api/scheduling/schedules
 */
import { auth } from '@/auth';
import { ApiError, ApiErrors } from '@/lib/api/error-handler';
import { isCossSchedulingConfigured } from '@/lib/coss/client';
import type { ProviderHostUser } from '@/lib/coss/provider-schedules';
import { ROLES } from '@/lib/constants';
import { getUserRepository } from '@/repositories';

export async function requireProviderForSchedules(): Promise<ProviderHostUser> {
  if (!isCossSchedulingConfigured()) {
    throw new ApiError(503, 'Scheduling coss non configuré', 'COSS_NOT_CONFIGURED');
  }

  const session = await auth();
  const userEmail = session?.user?.email;
  if (!userEmail) throw ApiErrors.UNAUTHORIZED;

  const userRepository = getUserRepository();
  const user = await userRepository.findByEmail(userEmail);
  if (!user) throw ApiErrors.NOT_FOUND;

  const roles: string[] = Array.isArray(user.roles)
    ? user.roles
    : user.roles
      ? [String(user.roles)]
      : [];
  if (!roles.includes(ROLES.PROVIDER)) {
    throw ApiErrors.FORBIDDEN;
  }

  const id = user.id || (user as { _id?: { toString(): string } })._id?.toString() || '';
  if (!id) throw ApiErrors.NOT_FOUND;

  const result: ProviderHostUser = { id, email: user.email, name: user.name };
  const firstName = (user as { firstName?: string }).firstName;
  const lastName = (user as { lastName?: string }).lastName;
  if (firstName !== undefined) result.firstName = firstName;
  if (lastName !== undefined) result.lastName = lastName;
  if (user.preferences !== undefined) {
    result.preferences = user.preferences as { timezone?: string };
  }
  return result;
}

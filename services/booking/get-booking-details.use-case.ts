import { ApiErrors } from '@/lib/api/error-handler';
import { DATABASE, ROLES } from '@/lib/constants';
import { getMongoClient } from '@/lib/database/mongodb';
import { bookingMapper } from '@/lib/mappers';
import { bookingService } from '@/services/booking/booking.service';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

interface GetBookingDetailsInput {
  bookingId: string;
  userId: string;
  roles: string[];
}

function canAccessBookingDirectly({
  roles,
  userId,
  providerId,
  requesterId,
}: {
  roles: string[];
  userId: string;
  providerId: string | undefined;
  requesterId: string | undefined;
}): boolean {
  const isAdmin = roles.includes(ROLES.ADMIN) || roles.includes(ROLES.SUPERADMIN);
  const isProvider = roles.includes(ROLES.PROVIDER);
  const isCustomer = roles.includes(ROLES.CUSTOMER);

  return (
    isAdmin ||
    (isProvider && providerId === userId) ||
    (isCustomer && requesterId === userId)
  );
}

async function isProviderInCsmPortfolio(userId: string, providerId?: string): Promise<boolean> {
  if (!providerId) {
    return false;
  }

  const client = await getMongoClient();
  const db = client.db();
  const users = db.collection(DATABASE.COLLECTIONS.USERS);
  const csm = await users.findOne(
    { _id: new ObjectId(userId) },
    { projection: { csmPortfolioProviderIds: 1 } },
  );
  const ids = (csm?.['csmPortfolioProviderIds'] as string[] | undefined) || [];

  return ids.includes(providerId);
}

export async function getBookingDetailsUseCase({
  bookingId,
  userId,
  roles,
}: GetBookingDetailsInput) {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw ApiErrors.VALIDATION_ERROR({ bookingId: 'ID de réservation invalide' });
  }

  const booking = await bookingService.getBookingById(bookingId);

  if (!booking) {
    throw ApiErrors.NOT_FOUND;
  }

  const mappedBooking = bookingMapper.map(booking as any);
  const providerId = (mappedBooking as any).providerId as string | undefined;
  const requesterId = (mappedBooking as any).requesterId as string | undefined;

  if (
    canAccessBookingDirectly({ roles, userId, providerId, requesterId }) ||
    (roles.includes(ROLES.CSM) && await isProviderInCsmPortfolio(userId, providerId))
  ) {
    return mappedBooking;
  }

  throw ApiErrors.FORBIDDEN;
}

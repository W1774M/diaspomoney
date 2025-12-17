/**
 * API Route - Get Booking Progress for Admin
 * Endpoint pour récupérer tous les bookings avec leur progression
 * Permet à l'admin de suivre où chaque client est bloqué
 */
import { auth } from '@/auth';
import { handleApiRoute, ApiErrors } from '@/lib/api/error-handler';
import { childLogger } from '@/lib/logger';
import { bookingService } from '@/services/booking/booking.service';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/admin/bookings/progress',
  });

  return handleApiRoute(
    request,
    async () => {
      const session = await auth();
      
      // Vérifier que l'utilisateur est admin
      // TODO: Ajouter une vérification de rôle admin
      if (!session?.user?.email) {
        throw ApiErrors.UNAUTHORIZED;
      }

      // Récupérer tous les bookings
      const bookingsResult = await bookingService.getBookings({
        limit: 1000, // Récupérer un grand nombre pour l'admin
        offset: 0,
      });
      
      const bookings = bookingsResult.data || [];

      // Filtrer et formater les bookings avec leur progression
      const bookingsWithProgress = bookings.map((booking) => {
        const metadata = booking.metadata || {};
        const progressHistory = metadata['progressHistory'] || [];
        const isDraft = metadata['isDraft'] === true;
        const currentStep = metadata['currentStep'] || 0;
        const stepName = metadata['stepName'] || 'Non démarré';
        const lastUpdatedAt = metadata['lastUpdatedAt'] || booking.updatedAt?.toISOString();

        return {
          id: booking.id || (booking as any)._id?.toString(),
          reservationNumber: booking.reservationNumber,
          requesterId: booking.requesterId,
          status: booking.status,
          isDraft,
          currentStep,
          stepName,
          lastUpdatedAt,
          progressHistory: Array.isArray(progressHistory) ? progressHistory : [],
          clientEmail: metadata['clientEmail'],
          clientName: metadata['clientName'],
          beneficiaryName: metadata['beneficiaryName'],
          serviceLabel: metadata['serviceLabel'],
          servicePrice: metadata['servicePrice'],
          serviceType: booking.serviceType,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
        };
      });

      // Trier par dernière mise à jour (les plus récents en premier)
      bookingsWithProgress.sort((a: typeof bookingsWithProgress[0], b: typeof bookingsWithProgress[0]) => {
        const dateA = new Date(a.lastUpdatedAt || a.updatedAt || 0).getTime();
        const dateB = new Date(b.lastUpdatedAt || b.updatedAt || 0).getTime();
        return dateB - dateA;
      });

      log.info(
        {
          totalBookings: bookingsWithProgress.length,
          draftBookings: bookingsWithProgress.filter((b: typeof bookingsWithProgress[0]) => b.isDraft).length,
        },
        'Bookings progress retrieved for admin',
      );

      return {
        success: true,
        bookings: bookingsWithProgress,
        total: bookingsWithProgress.length,
        drafts: bookingsWithProgress.filter((b) => b.isDraft).length,
      };
    },
    'api/admin/bookings/progress',
  );
}


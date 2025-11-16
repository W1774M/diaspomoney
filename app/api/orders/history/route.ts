import { auth } from '@/auth';
import { getMongoClient } from '@/lib/database/mongodb';
import { childLogger } from '@/lib/logger';
import { getBookingRepository, getInvoiceRepository } from '@/repositories';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route pour récupérer l'historique des commandes
 * Implémente les design patterns :
 * - Repository Pattern (via getBookingRepository, getInvoiceRepository)
 * - Service Layer Pattern (via les repositories)
 * - Logger Pattern (structured logging avec childLogger)
 */

export async function GET(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/orders/history',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id;

    log.debug({ userId }, 'Fetching historical orders');

    // Utiliser le repository (Repository Pattern)
    const bookingRepository = getBookingRepository();

    // Récupérer les bookings terminés ou annulés (COMPLETED, CANCELLED)
    const historicalBookingsResult =
      await bookingRepository.findBookingsWithFilters(
        {
          requesterId: userId,
        },
        {
          limit: 100,
          offset: 0,
          sort: { createdAt: -1 },
        }
      );

    // Filtrer pour avoir seulement les statuts terminés ou annulés
    const historicalBookings = historicalBookingsResult.data.filter(
      b => b.status === 'COMPLETED' || b.status === 'CANCELLED'
    );

    // Récupérer les données brutes depuis MongoDB pour avoir selectedService, beneficiary, etc.
    const Booking = (await import('@/models/Booking')).default;
    const bookingIds = historicalBookings.map(b => b.id || b._id);
    const bookingDocs = await (Booking as any)
      .find({
        _id: {
          $in: bookingIds.map((id: any) => new mongoose.Types.ObjectId(id)),
        },
      })
      .lean();

    const bookingDocMap = new Map(
      bookingDocs.map((doc: any) => [doc._id.toString(), doc])
    );

    // Récupérer les informations des prestataires séparément
    const User = (await import('@/models/User')).default;
    const providerIds = Array.from(
      new Set(
        historicalBookings
          .map((b: any) => b.providerId as string)
          .filter((id: any): id is string => Boolean(id))
      )
    ) as string[];

    interface ProviderInfo {
      _id: mongoose.Types.ObjectId;
      name?: string;
      firstName?: string;
      lastName?: string;
      avatar?: string;
      email?: string;
      specialties?: string[];
    }

    const providers = (await (User as any)
      .find({
        _id: {
          $in: providerIds.map((id: string) => new mongoose.Types.ObjectId(id)),
        },
        roles: 'PROVIDER',
      })
      .select('name email avatar specialties firstName lastName')
      .lean()) as ProviderInfo[];

    const providerMap = new Map<string, ProviderInfo>(
      providers.map((p: ProviderInfo) => [p._id.toString(), p])
    );

    // Utiliser le repository pour les factures
    const invoiceRepository = getInvoiceRepository();

    // Récupérer toutes les reviews pour les bookings de l'utilisateur
    const client = await getMongoClient();
    const db = client.db();
    const reviewsCollection = db.collection('reviews');

    const bookingIdsForReviews = historicalBookings.map(
      b => b.id || b._id || ''
    );
    const reviews = await reviewsCollection
      .find({
        bookingId: { $in: bookingIdsForReviews },
        userId: userId,
      })
      .toArray();

    // Créer un map des reviews par bookingId pour accès rapide
    const reviewsMap = new Map(
      reviews.map((review: any) => [
        review.bookingId?.toString() || '',
        {
          rating: review.rating,
          comment: review.comment || review.review,
          reviewedAt: review.createdAt || review.reviewedAt,
        },
      ])
    );

    // Transformer en HistoricalOrder
    const orders = await Promise.all(
      historicalBookings.map(async booking => {
        // Récupérer les données complètes depuis MongoDB
        const bookingDoc: any = bookingDocMap.get(
          booking.id || booking._id || ''
        );
        const bookingStatus = booking.status.toLowerCase();
        const docStatus = bookingDoc?.status?.toLowerCase() || bookingStatus;

        const provider = providerMap.get(booking.providerId);
        const providerName = provider
          ? provider.name ||
            `${provider.firstName || ''} ${provider.lastName || ''}`.trim()
          : 'Prestataire';

        // Chercher la facture associée via le repository
        const invoices = await invoiceRepository.findAll({
          customerId: userId,
          providerId: booking.providerId,
        });
        const invoice = invoices[0];

        // Récupérer la review associée au booking
        const bookingIdStr = (booking.id || booking._id || '').toString();
        const reviewData = reviewsMap.get(bookingIdStr);

        // Vérifier si on peut réserver à nouveau (seulement si terminé, pas annulé)
        const canReorder =
          booking.status === 'COMPLETED' || docStatus === 'completed';

        return {
          _id: booking.id || booking._id || '',
          orderNumber:
            (bookingDoc as any)?.reservationNumber ||
            `CMD-${(booking.id || booking._id || '').slice(-6)}`,
          bookingId: booking.id || booking._id || '',
          serviceType: 'health' as const,
          serviceName: bookingDoc?.selectedService?.name || 'Service de santé',
          providerId: booking.providerId,
          providerName,
          providerAvatar: provider?.avatar,
          status:
            booking.status === 'COMPLETED' || docStatus === 'completed'
              ? 'completed'
              : 'cancelled',
          completedDate: booking.updatedAt || booking.createdAt,
          cancelledDate:
            booking.status === 'CANCELLED' || docStatus === 'cancelled'
              ? booking.updatedAt
              : undefined,
          amount: (bookingDoc as any)?.selectedService?.price || 0,
          currency: 'EUR',
          paymentStatus: 'paid',
          invoiceId: invoice?.id || invoice?._id,
          invoiceNumber: invoice?.invoiceNumber,
          rating: reviewData?.rating,
          review: reviewData?.comment,
          reviewedAt: reviewData?.reviewedAt,
          canReorder,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
        };
      })
    );

    log.info(
      {
        userId,
        ordersCount: orders.length,
        reviewsCount: reviews.length,
      },
      'Historical orders fetched successfully'
    );

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    log.error(
      { error, msg: 'Error fetching historical orders' },
      'Error fetching historical orders'
    );
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'historique" },
      { status: 500 }
    );
  }
}

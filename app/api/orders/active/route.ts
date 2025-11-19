import { auth } from '@/auth';
import { childLogger } from '@/lib/logger';
import { UserRole } from '@/lib/types';
import { HTTP_STATUS_CODES } from '@/lib/constants';
import type { BookingDocument } from '@/lib/types';
import {
  getBookingRepository,
  getConversationRepository,
  getUserRepository,
} from '@/repositories';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route pour récupérer les commandes actives
 * Implémente les design patterns :
 * - Repository Pattern (via getBookingRepository, getUserRepository, getConversationRepository)
 * - Service Layer Pattern (via les repositories)
 * - Logger Pattern (structured logging avec childLogger)
 */

export async function GET(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({ requestId: reqId, route: 'api/orders/active' });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: HTTP_STATUS_CODES.UNAUTHORIZED });
    }

    const userId = session.user.id;

    log.debug({ userId, msg: 'Fetching active orders' });

    // Utiliser le repository (Repository Pattern)
    const bookingRepository = getBookingRepository();

    // Récupérer les bookings actifs (PENDING, CONFIRMED)
    // Note: Le repository fait le mapping entre userId (MongoDB) et requesterId (interface)
    const activeBookingsResult =
      await bookingRepository.findBookingsWithFilters(
        {
          requesterId: userId,
        },
        {
          limit: 100,
          page: 1,
          offset: 0,
          sort: { createdAt: -1 },
        },
      );

    const { BOOKING_STATUSES } = await import('@/lib/constants');
    // Filtrer pour avoir seulement les statuts actifs (PENDING, CONFIRMED)
    const activeBookings = activeBookingsResult.data.filter(
      b => b.status === BOOKING_STATUSES.PENDING || b.status === BOOKING_STATUSES.CONFIRMED,
    );

    // Récupérer les données brutes depuis MongoDB pour avoir selectedService, beneficiary, etc.
    // Note: Le repository ne retourne pas toutes les données du modèle MongoDB
    // On utilise donc directement le modèle pour les données complètes
    const Booking = (await import('@/models/Booking')).default;
    const bookingIds = activeBookings.map(b => b.id || b._id);
    const bookingDocs = (await (Booking as any)
      .find({
        _id: {
          $in: bookingIds.map((id: string) => new mongoose.Types.ObjectId(id)),
        },
      })
      .lean()) as BookingDocument[];

    const bookingDocMap = new Map<string, BookingDocument>(
      bookingDocs.map((doc: BookingDocument) => [doc._id.toString(), doc]),
    );

    // Récupérer les informations des prestataires séparément via Repository Pattern
    const userRepository = getUserRepository();
    const providerIds = Array.from(
      new Set(
        activeBookings
          .map((b) => b.providerId as string)
          .filter((id: string | undefined): id is string => Boolean(id)),
      ),
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

    // Récupérer les providers via le repository
    const providers = await Promise.all(
      providerIds.map(async (id: string) => {
        try {
          const user = await userRepository.findById(id);
          if (user && user.roles?.includes(UserRole.PROVIDER)) {
            return {
              _id: new mongoose.Types.ObjectId(id),
              name: user.name,
              firstName: user.firstName,
              lastName: user.lastName,
              avatar: user['avatar'],
              email: user.email,
              specialties: user['specialties'] || [],
            } as ProviderInfo;
          }
          return null;
        } catch {
          return null;
        }
      }),
    );

    const validProviders = providers.filter(
      (p): p is ProviderInfo => p !== null,
    );

    const providerMap = new Map<string, ProviderInfo>(
      validProviders.map(p => [p._id.toString(), p]),
    );

    // Récupérer les conversations pour chaque booking (customer <-> provider)
    const conversationRepository = getConversationRepository();
    const conversationMap = new Map<string, string>(); // bookingId -> conversationId

    // Récupérer les conversations entre userId et chaque provider
    await Promise.all(
      providerIds.map(async (providerId: string) => {
        try {
          const conversation = await conversationRepository.findByParticipants(
            [userId, providerId],
            'user',
          );
          if (conversation?._id) {
            // Trouver tous les bookings entre userId et providerId
            activeBookings
              .filter((b) => b.providerId === providerId)
              .forEach((booking) => {
                const bookingId = booking.id || booking._id;
                if (bookingId) {
                  conversationMap.set(bookingId, conversation._id!.toString());
                }
              });
          }
        } catch (error) {
          log.debug({
            userId,
            providerId,
            error,
            msg: 'Failed to find conversation for booking',
          });
        }
      }),
    );

    // Transformer en ActiveOrder
    const orders = await Promise.all(
      activeBookings.map(async booking => {
        // Récupérer les données complètes depuis MongoDB
        const bookingDoc: BookingDocument | undefined = bookingDocMap.get(
          booking.id || booking._id || '',
        );
        const bookingStatus = booking.status?.toLowerCase() || '';
        const docStatus = bookingDoc?.['status']?.toLowerCase() || bookingStatus;

        const provider = providerMap.get(booking.providerId);
        const providerName = provider
          ? provider.name ||
            `${provider.firstName || ''} ${provider.lastName || ''}`.trim()
          : 'Prestataire';

        // Calculer la progression (exemple pour services de santé)
        const progressSteps = [
          {
            id: '1',
            name: 'Réservation confirmée',
            description: 'Votre réservation a été confirmée',
            status:
              docStatus === 'confirmed' || bookingStatus === 'confirmed'
                ? 'completed'
                : 'pending',
            completedAt:
              docStatus === 'confirmed' || bookingStatus === 'confirmed'
                ? booking.createdAt
                : undefined,
          },
          {
            id: '2',
            name: 'Prise de contact',
            description: 'Le prestataire vous contactera',
            status: 'pending',
          },
          {
            id: '3',
            name: 'Service en cours',
            description: 'Votre service est en cours de réalisation',
            status: 'pending',
          },
          {
            id: '4',
            name: 'Service terminé',
            description: 'Votre service a été complété',
            status: 'pending',
          },
        ];

        const completedSteps = progressSteps.filter(
          s => s.status === 'completed',
        ).length;
        const percentage = (completedSteps / progressSteps.length) * 100;

        // Estimer la date de livraison (7 jours après la réservation pour services de santé)
        const estimatedDeliveryDate = new Date(booking.createdAt);
        estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 7);

        return {
          _id: booking.id || booking._id || '',
          orderNumber:
            bookingDoc?.['reservationNumber'] ||
            `CMD-${(booking.id || booking._id || '').slice(-6)}`,
          bookingId: booking.id || booking._id || '',
          serviceType: 'health' as const, // Focus sur la santé
          serviceName: bookingDoc?.['selectedService']?.['name'] || 'Service de santé',
          serviceDescription: bookingDoc?.['selectedService']?.['description'],
          providerId: booking.providerId,
          providerName,
          providerAvatar: provider?.avatar,
          status:
            docStatus === 'confirmed' || bookingStatus === 'confirmed'
              ? 'confirmed'
              : 'pending',
          progress: {
            currentStep: completedSteps,
            totalSteps: progressSteps.length,
            steps: progressSteps,
            percentage: Math.round(percentage),
            estimatedCompletionDate: estimatedDeliveryDate,
          },
          assignedProviders: [
            {
              id: booking.providerId,
              name: providerName,
              avatar: provider?.avatar,
              role: 'main' as const,
              assignedAt: booking.createdAt,
            },
          ],
          estimatedDeliveryDate: estimatedDeliveryDate,
          beneficiary:
            bookingDoc?.['beneficiary'] || booking.recipient
              ? {
                  firstName:
                    bookingDoc?.['beneficiary']?.['firstName'] ||
                    booking.recipient?.firstName ||
                    '',
                  lastName:
                    bookingDoc?.['beneficiary']?.['lastName'] ||
                    booking.recipient?.lastName ||
                    '',
                  phone:
                    bookingDoc?.['beneficiary']?.['phone'] ||
                    booking.recipient?.phone ||
                    '',
                }
              : undefined,
          amount: bookingDoc?.['selectedService']?.['price'] || 0,
          currency: 'EUR',
          paymentStatus: 'pending',
          chatEnabled: true,
          conversationId: conversationMap.get(booking.id || booking._id || ''),
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
        };
      }),
    );

    log.info({
      userId,
      orderCount: orders.length,
      msg: 'Active orders retrieved successfully',
    });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    log.error({
      error,
      msg: 'Error fetching active orders',
    });

    return NextResponse.json(
      { error: 'Erreur lors de la récupération des commandes actives' },
      { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR },
    );
  }
}
